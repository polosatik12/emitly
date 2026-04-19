import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Check } from "lucide-react";

const requisites = [
  { label: "Название компании", value: "КАРПОВ АЛЕКСАНДР ВИКТОРОВИЧ (ИП)" },
  { label: "Адрес", value: "улица Абрамцевская, д. 5, кв./оф. кв. 94, г. Москва" },
  { label: "ИНН", value: "771593979816" },
  { label: "Номер счёта", value: "40802810001060004432" },
  { label: "Валюта", value: "RUR" },
  { label: "Банк", value: 'АО "АЛЬФА-БАНК"' },
  { label: "БИК", value: "044525593" },
  { label: "Корреспондентский счёт", value: "30101810200000000593" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function RequisitesModal({ open, onClose }: Props) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!open) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-card rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 pb-3 sticky top-0 bg-card">
          <h3 className="text-[16px] font-bold text-foreground">Реквизиты</h3>
          <button onClick={onClose} className="p-1">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-5 pb-6 divide-y divide-[hsl(var(--border))]">
          {requisites.map((item, i) => (
            <div key={i} className="py-3 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-muted-foreground">{item.label}</p>
                <p className="text-[14px] text-foreground mt-0.5 break-words">{item.value}</p>
              </div>
              <button
                onClick={() => copyToClipboard(item.value, i)}
                className="p-1.5 shrink-0 mt-2"
              >
                {copiedIndex === i ? (
                  <Check className="h-4 w-4 text-[hsl(160,84%,39%)]" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-[12px] text-muted-foreground pb-4">© 2026 Emitly</p>
      </div>
    </div>,
    document.body
  );
}
