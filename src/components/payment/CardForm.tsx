"use client";

import React, { useState } from "react";
import { CreditCard, Calendar, User, Lock } from "lucide-react";
import { CardFormInput } from "@/lib/types";

interface CardFormProps {
  onSubmit: (data: CardFormInput) => void;
  isLoading?: boolean;
}

export const CardForm: React.FC<CardFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<CardFormInput>({
    cardHolderName: "",
    brand: "Visa",
    last4: "",
    expMonth: 12,
    expYear: 2026,
    isDefault: true,
  });

  const [cardNumber, setCardNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate real card data extraction
    onSubmit({
      ...formData,
      last4: cardNumber.slice(-4),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Titular de la tarjeta</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            required
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background"
            placeholder="John Doe"
            value={formData.cardHolderName}
            onChange={(e) => setFormData({ ...formData, cardHolderName: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Número de tarjeta</label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            required
            maxLength={19}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background font-mono"
            placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\s/g, "").replace(/\D/g, "");
              const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
              setCardNumber(formatted);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Expiración</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              required
              placeholder="MM/YY"
              className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background"
              onChange={(e) => {
                const [m, y] = e.target.value.split("/");
                setFormData({
                  ...formData,
                  expMonth: parseInt(m) || 12,
                  expYear: 2000 + (parseInt(y) || 26),
                });
              }}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">CVV</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              required
              maxLength={4}
              placeholder="123"
              className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.isDefault}
          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="isDefault" className="text-sm text-muted-foreground select-none">
          Guardar como tarjeta predeterminada
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Confirmar Tarjeta
          </>
        )}
      </button>
    </form>
  );
};
