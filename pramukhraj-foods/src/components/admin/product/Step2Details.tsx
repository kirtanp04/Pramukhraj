import type { UseFormReturn } from "react-hook-form";
import type { ProductFormValues } from "@/types/productSchema";
import {
  FormField,
  ToggleField,
  inputCls,
} from "@/components/admin/product/FormField";


interface Step2DetailsProps {
  form: UseFormReturn<ProductFormValues>;
}

export function Step2Details({ form }: Step2DetailsProps) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = form;

  return (
    <div className="space-y-6">
      {/* ── Section: Physical ── */}
      <section>
        <h3 className="mb-4 font-display text-base font-semibold text-ink">
          Physical Details
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Country of Origin */}
          <FormField
            label="Country of Origin"
            error={errors.countryOfOrigin?.message}
            required
          >
            <input
              {...register("countryOfOrigin")}
              placeholder="e.g. India"
              className={inputCls(!!errors.countryOfOrigin)}
            />
          </FormField>

          {/* Barcode */}
          <FormField
            label="Barcode / EAN"
            error={errors.barcode?.message}
            hint="Optional — leave blank if not available"
          >
            <input
              {...register("barcode")}
              placeholder="e.g. 890XXXXXXXXXX"
              className={inputCls(!!errors.barcode)}
            />
          </FormField>

          {/* Shelf Life */}
          <FormField
            label="Shelf Life"
            error={errors.shelfLife?.message}
            hint="Leave blank if the product has no expiry"
          >
            <input
              {...register("shelfLife")}
              placeholder="e.g. 12 months from manufacture date"
              className={inputCls(!!errors.shelfLife)}
            />
          </FormField>

          {/* Vegetarian toggle */}
          <div className="sm:col-span-2">
            <ToggleField
              label="Vegetarian"
              description="Mark this product as vegetarian (green dot on storefront)"
              checked={watch("isVegetarian")}
              onCheckedChange={v => setValue("isVegetarian", v)}
            />
          </div>
        </div>
      </section>

      {/* ── Section: Content / Nutrition ── */}
      <section>
        <h3 className="mb-4 font-display text-base font-semibold text-ink">
          Content & Nutrition
        </h3>
        <div className="grid gap-4">
          <FormField
            label="Ingredients"
            error={errors.ingredients?.message}
            hint="Comma-separated list of ingredients as they appear on the label"
          >
            <textarea
              {...register("ingredients")}
              rows={3}
              placeholder="Gram flour, edible oil, salt, spices, asafoetida…"
              className={inputCls(!!errors.ingredients)}
            />
          </FormField>

          <FormField
            label="Nutritional Information"
            error={errors.nutritionalInformation?.message}
            hint="Per serving / per 100g — can be free-text or structured"
          >
            <textarea
              {...register("nutritionalInformation")}
              rows={4}
              placeholder="Energy: 420 kcal, Protein: 12g, Carbohydrates: 60g, Fat: 14g…"
              className={inputCls(!!errors.nutritionalInformation)}
            />
          </FormField>

          <FormField
            label="Storage Instructions"
            error={errors.storageInstruction?.message}
          >
            <textarea
              {...register("storageInstruction")}
              rows={2}
              placeholder="Store in a cool, dry place away from direct sunlight…"
              className={inputCls(!!errors.storageInstruction)}
            />
          </FormField>
        </div>
      </section>
    </div>
  );
}
