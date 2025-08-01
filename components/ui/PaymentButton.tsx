import React from "react";
import { Button } from "./button";
import { useStripe } from "@/lib/hooks/useStripe";
import { Spinner } from "./Spinner";
import { CreditCard } from "lucide-react";

interface PaymentButtonProps {
  planId: string;
  planName: string;
  price: number;
  billingCycle?: "monthly" | "yearly";
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  planId,
  planName,
  price,
  billingCycle = "monthly",
  variant = "default",
  size = "default",
  className = "",
  children,
}) => {
  const { createCheckoutSession, isLoading, error } = useStripe();

  const handlePayment = async () => {
    await createCheckoutSession(planId, billingCycle);
  };

  const formatPrice = (price: number, cycle: string) => {
    if (price === 0) return "Free";
    return `$${price}/${cycle === "yearly" ? "year" : "month"}`;
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handlePayment}
        disabled={isLoading}
        variant={variant}
        size={size}
        className={`w-full ${className}`}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <Spinner size={16} />
            <span>Processing...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <CreditCard size={16} />
            <span>
              {children ||
                `Subscribe to ${planName} - ${formatPrice(
                  price,
                  billingCycle
                )}`}
            </span>
          </div>
        )}
      </Button>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
};
