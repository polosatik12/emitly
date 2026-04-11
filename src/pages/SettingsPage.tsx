import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Calendar } from "lucide-react";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto pb-[60px] bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <button onClick={() => navigate(-1)} className="p-1 active:scale-95 transition-transform">
          <ArrowLeft className="h-5 w-5 text-foreground" strokeWidth={2.2} />
        </button>
        <h1 className="text-[17px] font-bold text-foreground">Настройки</h1>
      </div>

      <div className="px-4 pt-4">
        {/* Personal data card */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-card p-5">
          <h2 className="text-[16px] font-bold text-foreground">Личные данные</h2>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            Эти данные необязательны и используются для персонализации
          </p>

          {/* ФИО */}
          <div className="mt-5">
            <label className="text-[14px] font-semibold text-foreground">ФИО</label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-background px-4 py-3">
              <User className="h-[18px] w-[18px] text-muted-foreground shrink-0" strokeWidth={1.8} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Иванов Иван Иванович"
                className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
                maxLength={100}
              />
            </div>
          </div>

          {/* Телефон */}
          <div className="mt-4">
            <label className="text-[14px] font-semibold text-foreground">Телефон</label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-background px-4 py-3">
              <Phone className="h-[18px] w-[18px] text-muted-foreground shrink-0" strokeWidth={1.8} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 123-45-67"
                className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
                maxLength={20}
              />
            </div>
          </div>

          {/* Дата рождения */}
          <div className="mt-4">
            <label className="text-[14px] font-semibold text-foreground">Дата рождения</label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-background px-4 py-3">
              <Calendar className="h-[18px] w-[18px] text-muted-foreground shrink-0" strokeWidth={1.8} />
              <input
                type="text"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                placeholder="24.03.2026"
                className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
                maxLength={10}
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <button className="mt-6 w-full rounded-xl bg-[hsl(var(--chip-selected-bg))] py-3.5 text-[15px] font-semibold text-white active:scale-[0.97] transition-transform">
          Сохранить
        </button>
      </div>
    </div>
  );
}
