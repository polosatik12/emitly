TELEGRAM_CHANNELS = [
    "finamalert",
    "alfa_investments",
    "vtbmyinvestments",
    "tb_invest_official",
    "sberinvestments",
    "bcsusa",
    "investfuture",
    "investingcorp",
    "rbc_news",
    "banksta",
    "smartlab",
    "russianmacro",
    "beststocksru",
    "dohod",
    "coin_post",
    "reportscompanies",
    "MarketTwits",
    "moextrades",
    "cbrstocks",
    "stock_news",
    "headlines_for_traders",
    "spydell_finance",
    "fundamentalinvestments",
    "finkrolik",
    "gpb_investments",
    "forbesrussia",
    "kommersant",
    "angrybonds",
    "marketpowercomics",
    "theinsider",
    "selfinvestor",
    "nebrexnya",
    "headlines_MACRO",
    "AK47pfl",
    "Finindie",
    "tradersgroup_pro",
    "financemarker",
    "truecon",
    "mozgovikresearch",
    "InvestHeroes",
    "xtxixty",
    "profit1",
    "RSHB_Invest",
    "sovcombankinvest",
    "expertosphere",
    "c0ldness",
    "natgas69",
]

WEBSITES = [
    # Financial news
    "https://smart-lab.ru",
    "https://ru.investing.com",
    "https://finam.ru",
    "https://rbc.ru/investments",
    "https://vedomosti.ru",
    "https://www.tradingview.com",
    "https://blackterminal.com",
    "https://conomy.ru",
    "https://dohod.ru",
    "https://mfd.ru",
    "https://e-disclosure.ru",
    "https://disclosure.ru",
    "https://moex.com",
    "https://cbonds.ru",
    "https://nsd.ru",
    "https://interfax.ru",
    "https://www.profinance.ru",
    "https://tradingeconomics.com",
    "https://alenka.capital",
    "https://finrange.com",
    # Corporate investor relations
    "https://lukoil.ru/InvestorAndShareholderCenter",
    "https://www.sberbank.com/ru/investor-relations/groupresults",
    "https://www.gazprom.ru/investors/disclosure",
    "https://t-technologies.ru/results/",
    "https://www.tatneft.ru/aktsioneram-i-investoram/raskritie-informatsii/",
    "https://www.novatek.ru/ru/investors/",
    "https://ir.yandex.ru/financial-releases",
    "https://nornickel.ru/investors/disclosure/",
    "https://www.polyus.com/ru/investors/disclosure/",
    "https://www.x5.ru/ru/investors/",
    "https://www.rosneft.ru/Investors/statements_and_presentations/",
    "https://www.surgutneftegas.ru/investors/",
    "https://severstal.com/rus/ir/",
    "https://www.interrao.ru/investors/",
    "https://moskva.mts.ru/about/investoram-i-akcioneram/",
    "https://nlmk.com/ru/about/governance/regulatory-disclosure/",
    "https://www.vtb.ru/ir/statements/",
    "https://rusal.ru/investors/financial-stat/",
    "https://investor.hh.ru/ru/shareholders-and-investors",
    "https://ir.aeroflot.ru/ru/reporting/financial-results/",
    "https://www.phosagro.ru/investors/",
    "https://www.company.rt.ru/ir/results_and_presentations/",
    "https://alrosa.ru/investors/",
    "https://ir.mkb.ru/investor-relations/",
    "https://mmk.ru/ru/investor/",
    "https://sovcombank.ru/about/finances",
    "https://транснефть.рф/investors/",
    "https://sistema.ru/investors-and-shareholders/",
    "https://www.mcclinics.ru/investors/",
    "https://vk.company/ru/investors/",
    "https://enplusgroup.com/ru/investors/",
    "https://www.bspb.ru/investors/",
    "https://www.sovcomflot.ru/investors/",
    "https://group.ptsecurity.com/ru/investors/",
    "https://www.renins.ru/invest/",
    "https://mosenergo.gazprom.ru/investors/",
    "https://unipro.energy/shareholders/",
    "https://ugold.ru/invest",
]


class ParserRegistry:
    @staticmethod
    def get_channels() -> list[str]:
        return TELEGRAM_CHANNELS

    @staticmethod
    def get_websites() -> list[str]:
        return WEBSITES

    @staticmethod
    def get_all_sources() -> dict:
        return {
            "telegram": [
                {"name": ch, "url": f"https://t.me/{ch}", "type": "telegram"}
                for ch in TELEGRAM_CHANNELS
            ],
            "websites": [
                {"name": url, "url": url, "type": "website"}
                for url in WEBSITES
            ],
        }
