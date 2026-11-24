"use client";

import { useState } from "react";
import { MapPin, Check, X, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidPincode } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

/**
 * PincodeChecker — inline delivery validation widget.
 *
 * Calls the REAL endpoint GET /api/pincode/[pincode] (contract:
 * 6-digit → { ok:true, data:{ pincode, city, district, state, region, block } }).
 * No mock pincode list, no simulated delay. Endpoint contract is preserved —
 * this component only reads it.
 *
 * States: idle → checking → ok (shows city + Sonipat delivery promise when the
 * pincode is in Sonipat) | not-found | invalid | error (network/lookup failed —
 * shown as "couldn't verify", never as "not deliverable").
 *
 * Used in: Header/mobile drawer (compact variant), PDP buy panel (full variant).
 */

const STORAGE_KEY = "growplants-pincode";

export interface PincodeCheckerProps {
  variant?: "compact" | "full";
  className?: string;
}

type Status = "idle" | "checking" | "ok" | "not-found" | "invalid" | "error";

interface PincodeInfo {
  pincode: string;
  city: string;
  district: string;
  state: string;
  region: string;
  block: string;
}

export function PincodeChecker({ variant = "compact", className }: PincodeCheckerProps) {
  const [pincode, setPincode] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(STORAGE_KEY) ?? "";
  });
  const [status, setStatus] = useState<Status>("idle");
  const [info, setInfo] = useState<PincodeInfo | null>(null);

  const check = async () => {
    if (!isValidPincode(pincode)) {
      setStatus("invalid");
      return;
    }
    setStatus("checking");
    setInfo(null);
    try {
      const res = await fetch(`/api/pincode/${pincode}`);
      const json = await res.json();
      if (res.ok && json.ok) {
        setInfo(json.data as PincodeInfo);
        setStatus("ok");
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, pincode);
        }
      } else if (res.status === 404) {
        setStatus("not-found");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const reset = () => {
    setPincode("");
    setInfo(null);
    setStatus("idle");
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const isSonipat =
    info != null &&
    (info.city.toLowerCase().includes("sonipat") ||
      info.district.toLowerCase().includes("sonipat"));

  /* ------------------------------ compact ------------------------------ */
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1.5 text-body-sm", className)}>
        <MapPin className="size-4 text-brass shrink-0" aria-hidden="true" />
        {status === "ok" && info ? (
          <span className="flex items-center gap-1 text-moss font-medium">
            {info.pincode} · {info.city} <Check className="size-3.5" aria-hidden="true" />
          </span>
        ) : status === "not-found" ? (
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 text-terracotta font-medium hover:underline"
          >
            Not deliverable <X className="size-3.5" aria-hidden="true" />
          </button>
        ) : status === "error" ? (
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 text-ink-soft font-medium hover:underline"
          >
            Couldn&apos;t verify <RotateCcw className="size-3.5" aria-hidden="true" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(e) => {
                setPincode(e.target.value.replace(/\D/g, ""));
                setStatus("idle");
              }}
              onKeyDown={(e) => e.key === "Enter" && check()}
              placeholder="Enter pincode"
              aria-label="Check delivery pincode"
              className="h-7 w-24 text-body-sm px-2 rounded-md border-border"
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={check}
              disabled={pincode.length !== 6 || status === "checking"}
              className="h-7 px-2 text-body-sm"
            >
              {status === "checking" ? (
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              ) : (
                "Check"
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  /* ------------------------------- full -------------------------------- */
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor="pincode-input" className="text-body-sm font-medium text-foreground flex items-center gap-1.5">
        <MapPin className="size-4 text-brass" aria-hidden="true" />
        Check delivery
      </label>
      <div className="flex gap-2">
        <Input
          id="pincode-input"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => {
            setPincode(e.target.value.replace(/\D/g, ""));
            setStatus("idle");
          }}
          placeholder="Enter 6-digit pincode"
          aria-invalid={status === "invalid" || status === "not-found"}
          className="w-40"
        />
        <Button
          type="button"
          onClick={check}
          disabled={pincode.length !== 6 || status === "checking"}
          className="gap-2"
        >
          {status === "checking" ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Checking
            </>
          ) : (
            "Check"
          )}
        </Button>
      </div>
      {status === "invalid" && (
        <p className="text-body-sm text-terracotta">Enter a valid 6-digit pincode</p>
      )}
      {status === "ok" && info && (
        <p className="text-body-sm text-moss flex items-start gap-1.5 font-medium">
          <Check className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Deliverable to {info.city}, {info.state} — {info.pincode}
            {isSonipat && (
              <> · 1–2 business days in Sonipat · Free over ₹{FREE_SHIPPING_THRESHOLD}</>
            )}
          </span>
        </p>
      )}
      {status === "not-found" && (
        <p className="text-body-sm text-terracotta flex items-center gap-1.5 font-medium">
          <X className="size-4" aria-hidden="true" />
          Pincode not found — please check and re-enter
        </p>
      )}
      {status === "error" && (
        <p className="text-body-sm text-ink-soft flex items-center gap-1.5 font-medium">
          <RotateCcw className="size-4" aria-hidden="true" />
          Couldn&apos;t verify right now — please try again
        </p>
      )}
    </div>
  );
}
