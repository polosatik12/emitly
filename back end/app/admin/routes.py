from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func

from app.core.database import get_session
from app.auth.dependencies import require_admin
from app.admin.parser_control import (
    ParserState,
    SourceControl,
    can_parse,
    get_parser_state,
    is_emergency,
    set_parser_state,
)

router = APIRouter(prefix="/admin", tags=["admin"])


class ParserControlReq(BaseModel):
    action: str


class SourceControlReq(BaseModel):
    source: str
    action: str


@router.get("/parser/status")
async def get_parser_status(admin: dict = Depends(require_admin)):
    return {
        "global_state": get_parser_state().value,
        "can_parse": can_parse(),
        "is_emergency": is_emergency(),
        "sources": SourceControl.get_all_sources_status(),
    }


@router.post("/parser/control")
async def control_parser(req: ParserControlReq, admin: dict = Depends(require_admin)):
    if req.action == "start":
        set_parser_state(ParserState.RUNNING)
    elif req.action == "stop":
        set_parser_state(ParserState.STOPPED)
    elif req.action == "emergency":
        set_parser_state(ParserState.EMERGENCY)
    else:
        raise HTTPException(400, f"Unknown action: {req.action}")
    return {"status": "ok", "new_state": get_parser_state().value}


@router.post("/source/control")
async def control_source(req: SourceControlReq, admin: dict = Depends(require_admin)):
    if req.action == "enable":
        SourceControl.enable_source(req.source)
    elif req.action == "disable":
        SourceControl.disable_source(req.source)
    elif req.action == "emergency":
        SourceControl.emergency_stop_source(req.source)
    else:
        raise HTTPException(400, f"Unknown action: {req.action}")
    return {"status": "ok", "source": req.source, "action": req.action}


@router.get("/sources")
async def get_all_sources(admin: dict = Depends(require_admin), session=Depends(get_session)):
    from app.models.news_source import NewsSource
    from app.parsers.registry import ParserRegistry

    result = await session.execute(select(NewsSource).order_by(NewsSource.name))
    db_sources = result.scalars().all()
    registry = ParserRegistry.get_all_sources()
    source_status = SourceControl.get_all_sources_status()

    return {
        "db_sources": [
            {
                "id": s.id,
                "name": s.name,
                "type": s.source_type.value,
                "url": s.url,
                "enabled": s.enabled,
                "last_parsed": str(s.last_parsed) if s.last_parsed else None,
                "control_status": source_status.get(f"tg:{s.name}") or source_status.get(f"web:{s.url}", "active"),
            }
            for s in db_sources
        ],
        "registry_sources": registry,
    }


@router.post("/sources/{source_id}/toggle")
async def toggle_source(source_id: str, admin: dict = Depends(require_admin), session=Depends(get_session)):
    from app.models.news_source import NewsSource

    result = await session.execute(select(NewsSource).where(NewsSource.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(404, "Source not found")
    source.enabled = not source.enabled
    await session.commit()
    return {"status": "ok", "enabled": source.enabled}


@router.get("/users")
async def get_users(admin: dict = Depends(require_admin), session=Depends(get_session)):
    from app.auth.models import User

    result = await session.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "telegram_id": u.telegram_id,
            "telegram_username": u.telegram_username,
            "role": u.role.value,
            "is_verified": u.is_verified,
            "created_at": str(u.created_at),
            "last_login": str(u.last_login) if u.last_login else None,
        }
        for u in users
    ]


@router.post("/users/{user_id}/role")
async def set_user_role(user_id: str, role: str, admin: dict = Depends(require_admin), session=Depends(get_session)):
    from app.auth.models import User, UserRole

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    user.role = UserRole(role)
    await session.commit()
    return {"status": "ok", "new_role": role}


@router.get("/stats")
async def get_admin_stats(admin: dict = Depends(require_admin), session=Depends(get_session)):
    from app.auth.models import User
    from app.models.news_article import NewsArticle
    from app.subscriptions.models import UserSubscription, Payment

    total_users = await session.execute(select(func.count()).select_from(User))
    active_subs = await session.execute(select(func.count()).select_from(UserSubscription).where(UserSubscription.is_active == True))
    total_news = await session.execute(select(func.count()).select_from(NewsArticle))
    processed = await session.execute(select(func.count()).select_from(NewsArticle).where(NewsArticle.llm_processed == True))
    total_payments = await session.execute(select(func.count()).select_from(Payment).where(Payment.status == "success"))

    return {
        "total_users": total_users.scalar(),
        "active_subscriptions": active_subs.scalar(),
        "total_news": total_news.scalar(),
        "processed_news": processed.scalar(),
        "successful_payments": total_payments.scalar(),
        "parser_state": get_parser_state().value,
        "sources_active": sum(1 for s in SourceControl.get_all_sources_status().values() if s == "active"),
    }


@router.post("/backup/db")
async def backup_database(admin: dict = Depends(require_admin)):
    """Trigger database backup."""
    import subprocess
    import os
    from datetime import datetime

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"backup_{ts}.sql"
    backup_path = f"/backups/{filename}"

    os.makedirs("/backups", exist_ok=True)

    db_url = os.getenv("DATABASE_URL", "")
    # Extract connection info
    # Format: postgresql+asyncpg://user:pass@host:port/db
    # For pg_dump we need: postgresql://user:pass@host:port/db
    sync_url = db_url.replace("+asyncpg", "")

    try:
        # Use pg_dump if available
        result = subprocess.run(
            ["pg_dump", sync_url, "-f", backup_path],
            capture_output=True, text=True, timeout=60
        )
        if result.returncode == 0:
            return {"status": "ok", "filename": filename, "path": backup_path}
        else:
            return {"status": "error", "error": result.stderr}
    except FileNotFoundError:
        return {"status": "error", "error": "pg_dump not found. Install postgresql-client."}
    except Exception as e:
        return {"status": "error", "error": str(e)}


@router.get("/panel", response_class="fastapi.responses.HTMLResponse")
async def admin_panel():
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=ADMIN_HTML)


ADMIN_HTML = """
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin — News Parser</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0}
        .container{max-width:1200px;margin:0 auto;padding:20px}
        h1{font-size:24px;margin-bottom:20px}h2{font-size:18px;margin-bottom:12px;color:#94a3b8}
        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:24px}
        .card{background:#1e293b;border-radius:12px;padding:16px}
        .sv{font-size:28px;font-weight:700;color:#38bdf8}.sl{font-size:13px;color:#64748b;margin-top:4px}
        .section{margin-bottom:24px}
        .btn{padding:8px 16px;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500}
        .bg{background:#22c55e;color:#fff}.bg:hover{background:#16a34a}
        .br{background:#ef4444;color:#fff}.br:hover{background:#dc2626}
        .by{background:#eab308;color:#000}.by:hover{background:#ca8a04}
        .bb{background:#3b82f6;color:#fff}.bb:hover{background:#2563eb}
        .bs{padding:4px 10px;font-size:12px}
        .btn-g{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
        .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600}
        .b-running{background:#22c55e20;color:#4ade80}.b-stopped{background:#ef444420;color:#f87171}
        .b-emergency{background:#ef444440;color:#ff6b6b;animation:pulse 1s infinite}
        .b-active{background:#22c55e20;color:#4ade80}.b-disabled{background:#eab30820;color:#fbbf24}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{padding:8px;text-align:left;border-bottom:1px solid #334155}
        th{color:#64748b;font-size:11px;text-transform:uppercase}
        .si{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1e293b;font-size:13px}
        .sn{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .sl2{color:#38bdf8;text-decoration:none;margin-right:8px}
        .dz{border:1px solid #ef4444;border-radius:12px;padding:16px;background:#ef444410}
        .dz h3{color:#ef4444;margin-bottom:8px}
        .tabs{display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid #334155;flex-wrap:wrap}
        .tab{padding:8px 16px;cursor:pointer;color:#64748b;border-bottom:2px solid transparent;font-size:14px}
        .tab.a{color:#38bdf8;border-bottom-color:#38bdf8}
        .tc{display:none}.tc.a{display:block}
        .pg{display:flex;gap:8px;align-items:center;margin-top:12px}
        .pg button{background:#334155;color:#e2e8f0;border:none;padding:6px 12px;border-radius:6px;cursor:pointer}
        .pg button:disabled{opacity:.3}
        .pg span{color:#64748b;font-size:13px}
        input,select{background:#334155;border:1px solid #475569;color:#e2e8f0;padding:6px 12px;border-radius:6px;font-size:14px}
        label{font-size:13px;color:#94a3b8;margin-right:6px}
        .cr{display:flex;gap:12px;align-items:center;margin-bottom:8px}
    </style>
</head>
<body>
<div class="container">
<h1>Admin Panel</h1>
<div class="tabs">
<div class="tab a" onclick="st('dash')">Дашборд</div>
<div class="tab" onclick="st('parser')">Парсер</div>
<div class="tab" onclick="st('src')">Источники</div>
<div class="tab" onclick="st('users')">Пользователи</div>
<div class="tab" onclick="st('news')">Новости</div>
<div class="tab" onclick="st('cfg')">Настройки</div>
</div>

<div class="tc a" id="t-dash">
<div class="grid">
<div class="card"><div class="sv" id="s-u">—</div><div class="sl">Пользователи</div></div>
<div class="card"><div class="sv" id="s-s">—</div><div class="sl">Подписки</div></div>
<div class="card"><div class="sv" id="s-n">—</div><div class="sl">Новости</div></div>
<div class="card"><div class="sv" id="s-p">—</div><div class="sl">LLM обработано</div></div>
<div class="card"><div class="sv" id="s-pay">—</div><div class="sl">Оплаты</div></div>
<div class="card"><div class="sv" id="s-src">—</div><div class="sl">Источники</div></div>
</div>
<div class="card">
<h2>Парсер</h2>
<div class="btn-g" style="margin-top:8px"><span>Статус:</span><span class="badge b-running" id="p-state">RUNNING</span></div>
<div class="btn-g" style="margin-top:12px">
<button class="btn bs bg" onclick="cp('start')">Старт</button>
<button class="btn bs by" onclick="cp('stop')">Стоп</button>
<button class="btn bs br" onclick="cp('emergency')">Крит. остановка</button>
</div>
</div>
</div>

<div class="tc" id="t-parser">
<div class="card">
<h2>Запуск парсинга</h2>
<div class="btn-g" style="margin-top:12px">
<button class="btn bb" onclick="tp('telegram')">Telegram</button>
<button class="btn bb" onclick="tp('websites')">Сайты</button>
<button class="btn bb" onclick="tp('full')">Полный цикл</button>
</div>
<div id="ps" style="margin-top:12px;font-size:13px;color:#64748b"></div>
</div>
<div class="section" style="margin-top:16px">
<div class="dz">
<h3>Критические действия</h3>
<p style="margin-bottom:12px;font-size:13px;color:#94a3b8">Останавливает ВСЕ парсеры. Используйте если источник выдаёт некорректные данные.</p>
<div class="btn-g">
<button class="btn br" onclick="es()">Остановить ВСЕ</button>
<button class="btn bg" onclick="cp('start')">Перезапустить ВСЕ</button>
</div>
</div>
</div>
</div>

<div class="tc" id="t-src">
<div class="card">
<div class="btn-g" style="margin-bottom:12px">
<button class="btn bs bb" onclick="ls()">Обновить</button>
<input type="text" id="sf" placeholder="Фильтр..." oninput="fs()" style="width:200px">
</div>
<div id="sl">Загрузка...</div>
</div>
</div>

<div class="tc" id="t-users">
<div class="card">
<div class="btn-g" style="margin-bottom:12px"><button class="btn bs bb" onclick="lu()">Обновить</button></div>
<table><thead><tr><th>ID</th><th>Email</th><th>Telegram</th><th>Роль</th><th>Статус</th><th></th></tr></thead>
<tbody id="ut"><tr><td colspan="6">Загрузка...</td></tr></tbody></table>
</div>
</div>

<div class="tc" id="t-news">
<div class="card">
<div class="btn-g" style="margin-bottom:12px">
<button class="btn bs bb" onclick="ln()">Обновить</button>
<label>На стр:</label>
<select id="npp" onchange="ln()">
<option value="20" selected>20</option>
<option value="50">50</option>
<option value="100">100</option>
<option value="200">200</option>
</select>
</div>
<table><thead><tr><th>Заголовок</th><th>Источник</th><th>LLM</th><th>Дата</th></tr></thead>
<tbody id="nt"><tr><td colspan="4">Загрузка...</td></tr></tbody></table>
<div class="pg" id="npg"></div>
</div>
</div>

<div class="tc" id="t-cfg">
<div class="card">
<h2>Настройки</h2>
<div class="cr" style="margin-top:12px">
<label>Новостей за раз:</label>
<input type="number" id="cfg-nl" value="20" min="5" max="500" style="width:80px">
<button class="btn bs bb" onclick="ss('news_limit','cfg-nl')">Сохранить</button>
</div>
<div class="cr">
<label>Интервал парсинга (мин):</label>
<input type="number" id="cfg-pi" value="1" min="1" max="60" style="width:80px">
<span style="color:#64748b;font-size:12px">(требует рестарта celery_beat)</span>
</div>
<div class="cr" style="margin-top:8px">
<button class="btn bb" onclick="bk()">Бэкап БД</button>
<span id="bs2" style="font-size:13px;color:#64748b"></span>
</div>
</div>
</div>
</div>

<script>
const A='/api/v1/admin',M='/api/v1',T=localStorage.getItem('admin_token');
let np=1,asrc={};
function st(n){document.querySelectorAll('.tab').forEach(t=>t.classList.remove('a'));document.querySelectorAll('.tc').forEach(t=>t.classList.remove('a'));document.getElementById('t-'+n).classList.add('a');event.target.classList.add('a');if(n==='users')lu();if(n==='news')ln();if(n==='src')ls()}
async function api(p,m='GET',b=null){const o={method:m,headers:{'Authorization':'Bearer '+T}};if(b){o.headers['Content-Type']='application/json';o.body=JSON.stringify(b)}const r=await fetch(A+p,o);if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}
async function am(p,m='GET',b=null){const o={method:m,headers:{'Authorization':'Bearer '+T}};if(b){o.headers['Content-Type']='application/json';o.body=JSON.stringify(b)}const r=await fetch(M+p,o);if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}
async function ld(){try{const s=await api('/stats');$('s-u').textContent=s.total_users??'—';$('s-s').textContent=s.active_subscriptions??'—';$('s-n').textContent=s.total_news??'—';$('s-p').textContent=s.processed_news??'—';$('s-pay').textContent=s.successful_payments??'—';$('s-src').textContent=s.sources_active??'—';const e=$('p-state');e.textContent=(s.parser_state||'running').toUpperCase();e.className='badge b-'+(s.parser_state||'running')}catch(e){console.error(e)}}
function $(i){return document.getElementById(i)}
async function cp(a){if(a==='emergency'&&!confirm('КРИТИЧЕСКАЯ ОСТАНОВКА?'))return;try{await api('/parser/control','POST',{action:a});ld();ls()}catch(e){alert('Ошибка: '+e.message)}}
async function es(){if(!confirm('Остановить ВСЕ парсеры?'))return;if(!confirm('Точно?'))return;await cp('emergency')}
async function tp(t){$('ps').textContent='Запуск...';try{const r=await am('/parse/'+(t==='full'?'full':t==='telegram'?'telegram':'websites'),'POST');$('ps').innerHTML='<span style="color:#4ade80">Запущено: '+r.task_id+'</span>'}catch(e){$('ps').innerHTML='<span style="color:#f87171">Ошибка: '+e.message+'</span>'}}
async function ls(){try{const d=await api('/sources');asrc={};(d.db_sources||[]).forEach(s=>{asrc[s.name]={status:s.control_status,type:s.type,url:s.url,id:s.id,enabled:s.enabled}});if(d.registry_sources){(d.registry_sources.telegram||[]).forEach(s=>{if(!asrc[s.name])asrc[s.name]={status:'active',type:'telegram',url:s.url}});(d.registry_sources.websites||[]).forEach(s=>{if(!asrc[s.name])asrc[s.name]={status:'active',type:'website',url:s.url}})}rs()}catch(e){$('sl').innerHTML='<span style="color:#f87171">'+e.message+'</span>'}}
function rs(){const l=$('sl'),e=Object.entries(asrc);if(!e.length){l.innerHTML='<p style="color:#64748b">Нет данных</p>';return};l.innerHTML=e.map(([n,s])=>'<div class="si" data-n="'+n.toLowerCase()+'"><span class="sn">'+(s.url?'<a href="'+s.url+'" target="_blank" class="sl2">link</a>':'')+' <b>'+(s.type==='telegram'?'TG':'WEB')+'</b> '+n+'</span><div class="btn-g"><span class="badge b-'+s.status+'">'+s.status+'</span>'+(s.status!=='active'?'<button class="btn bs bg" onclick="ts(\\''+n+'\\',\'enable\')">Вкл</button>':'')+'<button class="btn bs by" onclick="ts(\\''+n+'\\',\'disable\')">Выкл</button><button class="btn bs br" onclick="ts(\\''+n+'\\',\'emergency\')">Stop</button></div></div>').join('')}
function fs(){const q=$('sf').value.toLowerCase();document.querySelectorAll('.si').forEach(el=>{el.style.display=el.dataset.n.includes(q)?'':'none'})}
async function ts(s,a){try{await api('/source/control','POST',{source:s,action:a});ls();ld()}catch(e){alert('Ошибка: '+e.message)}}
async function lu(){try{const u=await api('/users');const tb=$('ut');if(!u.length){tb.innerHTML='<tr><td colspan="6">Нет</td></tr>';return};tb.innerHTML=u.map(u=>'<tr><td style="font-size:11px">'+u.id.slice(0,8)+'</td><td>'+(u.email||'—')+'</td><td>'+(u.telegram_username||u.telegram_id||'—')+'</td><td>'+u.role+'</td><td>'+(u.is_verified?'OK':'')+'</td><td>'+(u.role!=='admin'?'<button class="btn bs bb" onclick="sr(\\''+u.id+'\\',\'admin\')">Admin</button>':'')+'</td></tr>').join('')}catch(e){$('ut').innerHTML='<tr><td colspan="6" style="color:#f87171">'+e.message+'</td></tr>'}}
async function sr(id,r){try{await api('/users/'+id+'/role?role='+r,'POST');lu()}catch(e){alert('Ошибка: '+e.message)}}
async function ln(p){np=p||1;const pp=$('npp').value;try{const d=await am('/news?page='+np+'&per_page='+pp);const tb=$('nt');if(!d.items.length){tb.innerHTML='<tr><td colspan="4">Нет</td></tr>'}else{tb.innerHTML=d.items.map(n=>'<tr><td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(n.title||'(нет)')+'</td><td style="font-size:11px">'+(n.source_id||'—').slice(0,8)+'</td><td>'+(n.llm_processed?'OK':'...')+'</td><td style="font-size:11px">'+(n.created_at||'—').slice(0,16)+'</td></tr>').join('')};const pg=Math.ceil(d.total/pp);$('npg').innerHTML='<button onclick="ln('+(np-1)+')"'+(np<=1?' disabled':'')+'>←</button><span>'+np+' / '+pg+' ('+d.total+')</span><button onclick="ln('+(np+1)+')"'+(np>=pg?' disabled':''')+'>→</button>'}catch(e){$('nt').innerHTML='<tr><td colspan="4" style="color:#f87171">'+e.message+'</td></tr>'}}
async function ss(k,i){localStorage.setItem('news_'+k,$(i).value);alert('Сохранено')}
async function bk(){const e=$('bs2');e.textContent='Запуск...';try{const r=await api('/backup/db','POST');e.textContent='OK: '+(r.filename||'?')}catch(r){e.textContent='Ошибка: '+(e.message||r.message)}}
ld();setInterval(ld,10000);
</script>
</body>
</html>
"""
