import { Controller, type UseFormReturn } from "react-hook-form";
import { LoaderCircle, Save } from "lucide-react";
import {
  FormField,
  ToggleField,
  inputCls,
} from "@/components/admin/product/FormField";
import { Button } from "@/components/ui/Button";
import { CouponScopeSelector } from "@/pages/admin/coupon/components/CouponScopeSelector";
import type { CouponFormValues } from "@/types/couponSchema";
import type { useCouponOptions } from "@/hooks/coupon/useCouponOptions";

interface CouponFormProps {
  form: UseFormReturn<CouponFormValues>;
  options: ReturnType<typeof useCouponOptions>;
  isBusy: boolean;
  submitLabel: string;
  onSubmit: (values: CouponFormValues) => Promise<void>;
  onInvalid: () => void;
  onCancel: () => void;
}

const nullableNumber = {
  setValueAs: (value: string) => (value === "" ? null : Number(value)),
};

export function CouponForm({
  form,
  options,
  isBusy,
  submitLabel,
  onSubmit,
  onInvalid,
  onCancel,
}: CouponFormProps) {
  const {
    register,
    control,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = form;
  const scope = watch("applicationScope");
  const discountType = watch("discountType");

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      className="space-y-5"
      noValidate
    >
      <section className="rounded-card border border-ink/10 bg-ivory p-5 shadow-sm">
        <h2 className="mb-4 font-display text-lg">Basic information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Coupon code"
            required
            error={errors.code?.message}
            hint="Letters, numbers, hyphens and underscores only."
          >
            <input
              {...register("code")}
              className={`${inputCls(!!errors.code)} uppercase`}
              maxLength={50}
              autoComplete="off"
            />
          </FormField>
          <FormField label="Coupon name" required error={errors.name?.message}>
            <input
              {...register("name")}
              className={inputCls(!!errors.name)}
              maxLength={150}
            />
          </FormField>
          <FormField
            label="Description"
            error={errors.description?.message}
            className="md:col-span-2"
          >
            <textarea
              {...register("description")}
              rows={3}
              className={inputCls(!!errors.description)}
              maxLength={1000}
            />
          </FormField>
        </div>
      </section>

      <section className="rounded-card border border-ink/10 bg-ivory p-5 shadow-sm">
        <h2 className="mb-4 font-display text-lg">Discount configuration</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField
            label="Discount type"
            required
            error={errors.discountType?.message}
          >
            <Controller
              control={control}
              name="discountType"
              render={({ field }) => (
                <select
                  {...field}
                  onChange={event => {
                    field.onChange(event.target.value);
                    if (event.target.value === "FreeShipping")
                      setValue("discountValue", 0, { shouldValidate: true });
                    if (event.target.value !== "Percentage") {
                      setValue("maximumDiscountAmount", null, {
                        shouldDirty: true,
                        shouldValidate: false,
                      });
                      clearErrors("maximumDiscountAmount");
                    }
                  }}
                  className={inputCls(!!errors.discountType)}
                >
                  <option value="Percentage">Percentage</option>
                  <option value="FlatAmount">Flat amount</option>
                  <option value="FreeShipping">Free shipping</option>
                </select>
              )}
            />
          </FormField>
          <FormField
            label="Discount value"
            required
            error={errors.discountValue?.message}
          >
            <input
              type="number"
              min="0"
              step="0.01"
              disabled={discountType === "FreeShipping"}
              {...register("discountValue", { valueAsNumber: true })}
              className={inputCls(!!errors.discountValue)}
            />
          </FormField>
          <FormField
            label="Minimum order (₹)"
            required
            error={errors.minimumOrderAmount?.message}
          >
            <input
              type="number"
              min="0"
              step="0.01"
              {...register("minimumOrderAmount", { valueAsNumber: true })}
              className={inputCls(!!errors.minimumOrderAmount)}
            />
          </FormField>
          <FormField
            label="Maximum discount (₹)"
            error={errors.maximumDiscountAmount?.message}
            hint={
              discountType !== "Percentage"
                ? "Percentage coupons only."
                : undefined
            }
          >
            <input
              type="number"
              min="0.01"
              step="0.01"
              disabled={discountType !== "Percentage"}
              {...register("maximumDiscountAmount", nullableNumber)}
              className={inputCls(!!errors.maximumDiscountAmount)}
              placeholder="Unlimited"
            />
          </FormField>
        </div>
      </section>

      <section className="rounded-card border border-ink/10 bg-ivory p-5 shadow-sm">
        <h2 className="mb-4 font-display text-lg">Applicability</h2>
        <FormField
          label="Application scope"
          required
          error={errors.applicationScope?.message}
        >
          <Controller
            control={control}
            name="applicationScope"
            render={({ field }) => (
              <select
                {...field}
                onChange={event => {
                  const value = event.target
                    .value as CouponFormValues["applicationScope"];
                  field.onChange(value);
                  if (value !== "SpecificProducts")
                    setValue("productIds", [], { shouldValidate: true });
                  if (value !== "SpecificCategories")
                    setValue("categoryIds", [], { shouldValidate: true });
                }}
                className={inputCls(!!errors.applicationScope)}
              >
                <option value="AllProducts">All products</option>
                <option value="SpecificProducts">Specific products</option>
                <option value="SpecificCategories">Specific categories</option>
              </select>
            )}
          />
        </FormField>
        <div className="mt-4">
          {scope === "SpecificProducts" && (
            <Controller
              control={control}
              name="productIds"
              render={({ field }) => (
                <div>
                  <CouponScopeSelector
                    label="Products"
                    items={options.products.items}
                    selectedIds={field.value}
                    onChange={field.onChange}
                    loading={options.products.loading}
                    error={options.products.error}
                    onRetry={() => options.retry("products")}
                  />
                  {errors.productIds?.message && (
                    <p className="mt-1 text-[11px] font-medium text-oxblood">
                      {errors.productIds.message}
                    </p>
                  )}
                </div>
              )}
            />
          )}
          {scope === "SpecificCategories" && (
            <Controller
              control={control}
              name="categoryIds"
              render={({ field }) => (
                <div>
                  <CouponScopeSelector
                    label="Categories"
                    items={options.categories.items}
                    selectedIds={field.value}
                    onChange={field.onChange}
                    loading={options.categories.loading}
                    error={options.categories.error}
                    onRetry={() => options.retry("categories")}
                  />
                  {errors.categoryIds?.message && (
                    <p className="mt-1 text-[11px] font-medium text-oxblood">
                      {errors.categoryIds.message}
                    </p>
                  )}
                </div>
              )}
            />
          )}
          {scope === "AllProducts" && (
            <p className="rounded-lg bg-ivory-dim px-4 py-3 text-sm text-ink-soft">
              This coupon applies to every product. No scope records will be
              created.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-card border border-ink/10 bg-ivory p-5 shadow-sm">
        <h2 className="mb-4 font-display text-lg">Usage limits</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Total usage limit"
            error={errors.totalUsageLimit?.message}
          >
            <input
              type="number"
              min="1"
              {...register("totalUsageLimit", nullableNumber)}
              className={inputCls(!!errors.totalUsageLimit)}
              placeholder="Unlimited"
            />
          </FormField>
          <FormField
            label="Per-customer limit"
            error={errors.perCustomerUsageLimit?.message}
          >
            <input
              type="number"
              min="1"
              {...register("perCustomerUsageLimit", nullableNumber)}
              className={inputCls(!!errors.perCustomerUsageLimit)}
              placeholder="Unlimited"
            />
          </FormField>
          <Controller
            control={control}
            name="isFirstOrderOnly"
            render={({ field }) => (
              <ToggleField
                label="First order only"
                description="Restrict redemption to a customer's first order."
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="canCombineWithOtherDiscounts"
            render={({ field }) => (
              <ToggleField
                label="Allow discount combinations"
                description="Permit this coupon alongside other discounts."
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </section>

      <section className="rounded-card border border-ink/10 bg-ivory p-5 shadow-sm">
        <h2 className="mb-4 font-display text-lg">Schedule and status</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Starts on" required error={errors.startOn?.message}>
            <input
              type="datetime-local"
              {...register("startOn")}
              className={inputCls(!!errors.startOn)}
            />
          </FormField>
          <FormField label="Ends on" required error={errors.endOn?.message}>
            <input
              type="datetime-local"
              {...register("endOn")}
              className={inputCls(!!errors.endOn)}
            />
          </FormField>
          <div className="sm:col-span-2">
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <ToggleField
                  label="Coupon active"
                  description="Inactive coupons cannot be redeemed even during their scheduled period."
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 rounded-card border border-ink/10 bg-ivory px-5 py-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isBusy}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isBusy}>
          {isBusy ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
