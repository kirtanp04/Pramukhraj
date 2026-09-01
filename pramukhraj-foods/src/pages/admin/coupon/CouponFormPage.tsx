import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { EntityFormError } from "@/components/admin/EntityFormError";
import { Skeleton } from "@/components/ui/Skeleton";
import { MessageDialog } from "@/components/ui/MessageDialog";
import { useCouponDetails } from "@/hooks/coupon/useCouponDetails";
import { useCouponOptions } from "@/hooks/coupon/useCouponOptions";
import { useMessageDialog } from "@/hooks/useMessageDialog";
import {
  getApiErrorMessage,
  getApiErrorStatus,
  getApiValidationErrors,
} from "@/lib/apiClient";
import { isValidGuid } from "@/lib/routeParams";
import { couponApi } from "@/services/couponApi";
import { CouponForm } from "@/pages/admin/coupon/components/CouponForm";
import {
  couponFormSchema,
  DEFAULT_COUPON_VALUES,
  mapCouponFormToRequest,
  mapCouponToForm,
  type CouponFormValues,
} from "@/types/couponSchema";

export function CouponFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const dialog = useMessageDialog();
  const isEditing = Boolean(id);
  const validId = !isEditing || isValidGuid(id);
  const details = useCouponDetails(id, isEditing && validId);
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: DEFAULT_COUPON_VALUES,
    mode: "onChange",
  });
  const scope = form.watch("applicationScope");
  const options = useCouponOptions(scope);

  useEffect(() => {
    if (details.data) form.reset(mapCouponToForm(details.data));
  }, [details.data, form]);

  function back() {
    navigate("/admin/coupons");
  }

  async function submit(values: CouponFormValues) {
    if (isSaving) return;
    setIsSaving(true);
    form.clearErrors();
    try {
      const payload = mapCouponFormToRequest(values);
      const response =
        isEditing && id
          ? await couponApi.update(id, payload)
          : await couponApi.create(payload);
      dialog.success(
        response.message ||
          (isEditing
            ? "Coupon updated successfully."
            : "Coupon created successfully."),
        {
          title: isEditing ? "Coupon Updated" : "Coupon Created",
          actionLabel: "Back to Coupons",
          onAction: () => navigate("/admin/coupons", { replace: true }),
        }
      );
    } catch (caught: unknown) {
      const validationErrors = getApiValidationErrors(caught);
      for (const [serverKey, messages] of Object.entries(validationErrors)) {
        const field =
          `${serverKey.charAt(0).toLowerCase()}${serverKey.slice(1)}` as keyof CouponFormValues;
        if (field in DEFAULT_COUPON_VALUES && messages[0])
          form.setError(field, { type: "server", message: messages[0] });
      }
      if (getApiErrorStatus(caught) === 409) {
        dialog.error(
          isEditing
            ? "The coupon changed or has redemption history. Refresh and try again."
            : getApiErrorMessage(caught),
          {
            title: isEditing
              ? "Could Not Update Coupon"
              : "Could Not Create Coupon",
          }
        );
      } else {
        dialog.error(getApiErrorMessage(caught), {
          title: isEditing
            ? "Could Not Update Coupon"
            : "Could Not Create Coupon",
        });
      }
    } finally {
      setIsSaving(false);
    }
  }

  function onInvalid() {
    dialog.error(
      "Some coupon details are incomplete or invalid. Please fix the highlighted fields.",
      {
        title: isEditing ? "Cannot Update Coupon" : "Cannot Create Coupon",
      }
    );
  }

  if (!validId)
    return (
      <EntityFormError
        title="Invalid coupon"
        message="The coupon ID in this URL is invalid."
        onBack={back}
      />
    );
  if (isEditing && details.isLoading) return <CouponFormSkeleton />;
  if (isEditing && details.error) {
    return (
      <EntityFormError
        title={
          details.error.status === 404
            ? "Coupon not found"
            : "Unable to load coupon"
        }
        message={details.error.message}
        onBack={back}
        onRetry={details.error.status === 404 ? undefined : details.retry}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={back}
          className="rounded-full p-2 text-ink-soft hover:bg-ink/5"
          aria-label="Back to coupons"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-2xl">
            {isEditing ? "Edit Coupon" : "Add Coupon"}
          </h1>
          <p className="text-sm text-ink-soft">
            {isEditing
              ? "Update coupon rules and availability."
              : "Create a secure promotion for your storefront."}
          </p>
        </div>
      </div>
      <CouponForm
        form={form}
        options={options}
        isBusy={form.formState.isSubmitting || isSaving}
        submitLabel={isEditing ? "Save changes" : "Create coupon"}
        onSubmit={submit}
        onInvalid={onInvalid}
        onCancel={back}
      />
      <MessageDialog {...dialog.props} />
    </div>
  );
}

function CouponFormSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-5" aria-busy="true">
      <Skeleton className="h-14 w-72" />
      {[1, 2, 3, 4].map(item => (
        <Skeleton key={item} className="h-44 rounded-card" />
      ))}
    </div>
  );
}
