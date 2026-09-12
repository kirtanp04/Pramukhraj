import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { EntityFormError } from "@/components/admin/EntityFormError";
import {
  FormField,
  ToggleField,
  inputCls,
} from "@/components/admin/product/FormField";
import { ReviewFormSkeleton } from "@/components/admin/review/ReviewFormSkeleton";
import { Button } from "@/components/ui/Button";
import { MessageDialog } from "@/components/ui/MessageDialog";
import { useMessageDialog } from "@/hooks/useMessageDialog";
import { useProductOptions } from "@/hooks/useProductOptions";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/apiClient";
import { isValidGuid } from "@/lib/routeParams";
import { cn } from "@/lib/utils";
import { reviewApi } from "@/services/reviewApi";
import {
  REVIEW_SOURCE,
  REVIEW_SOURCE_LABELS,
  REVIEW_STATUS,
  REVIEW_STATUS_LABELS,
  REVIEW_TYPE,
  type AdminReviewDetailsResponse,
  type CreateAdminReviewRequest,
  type ReviewSource,
  type ReviewStatus,
  type UpdateAdminReviewRequest,
} from "@/types/review";
import {
  createReviewSchema,
  DEFAULT_REVIEW_VALUES,
  updateReviewSchema,
  type ReviewFormValues,
} from "@/types/reviewSchema";

function mapReviewToForm(review: AdminReviewDetailsResponse): ReviewFormValues {
  return {
    ...DEFAULT_REVIEW_VALUES,
    customerName: review.customerName,
    customerCity: review.customerCity ?? "",
    productId: review.productId ?? "",
    source: review.source,
    rating: review.rating,
    title: review.title ?? "",
    comment: review.comment,
    sourceReference: review.sourceReference ?? "",
    status: review.status,
    rejectionReason: review.rejectionReason ?? "",
    hasCustomerConsent: review.hasCustomerConsent,
    isFeatured: review.isFeatured,
    isActive: review.isActive,
  };
}

export function AdminReviewFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const dialog = useMessageDialog();
  const [isInitialLoading, setIsInitialLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState<{ message: string; status?: number } | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [selectedProductName, setSelectedProductName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const mountedRef = useRef(true);
  
  const {
    products,
    isLoading: productsLoading,
    error: productsError,
    retry: retryProducts,
  } = useProductOptions();

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(isEditing ? updateReviewSchema : createReviewSchema),
    defaultValues: DEFAULT_REVIEW_VALUES,
    mode: "onChange",
  });
  const {
    register,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = form;
  const status = watch("status");
  const selectedProductId = watch("productId");
  const isBusy = isSubmitting || isSaving;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isEditing) {
      setIsInitialLoading(false);
      setLoadError(null);
      return;
    }

    if (!isValidGuid(id)) {
      setIsInitialLoading(false);
      setLoadError({ message: "The review ID in this URL is invalid.", status: 400 });
      return;
    }

    const reviewId = id;
    const controller = new AbortController();

    async function loadReview() {
      setIsInitialLoading(true);
      setLoadError(null);
      try {
        const review = await reviewApi.getById(reviewId, controller.signal);
        if (controller.signal.aborted) return;
        if (!review) throw new Error("Review not found.");
        if (review.reviewType !== REVIEW_TYPE.BrandTestimonial) {
          setLoadError({
            status: 400,
            message: "Customer-authored product reviews are read-only and cannot be edited.",
          });
          return;
        }
        reset(mapReviewToForm(review));
        setSelectedProductName(review.productName);
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        setLoadError({
          message: getApiErrorMessage(error),
          status: getApiErrorStatus(error),
        });
      } finally {
        if (!controller.signal.aborted) setIsInitialLoading(false);
      }
    }

    void loadReview();
    return () => controller.abort();
  }, [id, isEditing, loadAttempt, reset]);

  function goBack() {
    navigate("/admin/reviews");
  }

  async function onSubmit(values: ReviewFormValues) {
    setIsSaving(true);
    const shared: CreateAdminReviewRequest = {
      customerName: values.customerName,
      customerCity: values.customerCity || null,
      productId: values.productId || null,
      source: values.source as ReviewSource,
      rating: values.rating,
      title: values.title || null,
      comment: values.comment,
      status: values.status as ReviewStatus,
      hasCustomerConsent: values.hasCustomerConsent,
      isFeatured: values.isFeatured,
      isActive: values.isActive,
    };
    try {
      const response =
        isEditing && isValidGuid(id)
          ? await reviewApi.update(id, {
              ...shared,
              sourceReference: values.sourceReference || null,
              rejectionReason:
                values.status === REVIEW_STATUS.Rejected
                  ? values.rejectionReason || null
                  : null,
            } satisfies UpdateAdminReviewRequest)
          : await reviewApi.create(shared);
      if (!mountedRef.current) return;
      dialog.success(response.message, {
        title: isEditing ? "Testimonial Updated" : "Testimonial Created",
        actionLabel: "Back to Reviews",
        onAction: goBack,
      });
    } catch (submitError: unknown) {
      if (!mountedRef.current) return;
      dialog.error(getApiErrorMessage(submitError), {
        title: isEditing
          ? "Could Not Update Testimonial"
          : "Could Not Create Testimonial",
      });
    } finally {
      if (mountedRef.current) setIsSaving(false);
    }
  }

  function onInvalid() {
    dialog.error(
      "Some review details are incomplete or invalid. Please fix the highlighted fields.",
      { title: "Cannot Save Review" }
    );
  }

  if (productsLoading || isInitialLoading) return <ReviewFormSkeleton />;
  if (loadError) {
    const isNotFound = loadError.status === 404;
    return (
      <EntityFormError
        title={isNotFound ? "Review Not Found" : loadError.status === 400 ? "Review Cannot Be Edited" : "Unable to Load Review"}
        message={isNotFound ? "The requested review does not exist or has been removed." : loadError.message}
        onBack={goBack}
        onRetry={loadError.status === 400 || loadError.status === 404 ? undefined : () => setLoadAttempt(value => value + 1)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink-soft hover:bg-ink/5"
          aria-label="Back to reviews"
        >
          <ArrowLeft size={16} aria-hidden />
        </button>
        <div>
          <h1 className="font-display text-2xl">
            {isEditing ? "Edit Testimonial" : "New Testimonial"}
          </h1>
          <p className="text-sm text-ink-soft">
            {isEditing
              ? "Update testimonial content and publication settings."
              : "Create a consented customer testimonial for your storefront."}
          </p>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        noValidate
        aria-busy={isBusy}
        className="space-y-4"
      >
        <div
          className={cn(
            "rounded-card border border-ink/10 bg-ivory px-5 py-6 shadow-sm md:px-8 md:py-8",
            isBusy && "opacity-90"
          )}
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <section
              className="space-y-5"
              aria-labelledby="review-customer-heading"
            >
              <div>
                <h2
                  id="review-customer-heading"
                  className="font-display font-semibold"
                >
                  Customer & Source
                </h2>
                <p className="text-xs text-ink-soft">
                  Identify who provided the testimonial and where it came from.
                </p>
              </div>
              <FormField
                label="Customer Name"
                htmlFor="review-customer-name"
                error={errors.customerName?.message}
                required
              >
                <input
                  id="review-customer-name"
                  {...register("customerName")}
                  maxLength={120}
                  className={inputCls(!!errors.customerName)}
                />
              </FormField>
              <FormField
                label="Customer City"
                htmlFor="review-customer-city"
                error={errors.customerCity?.message}
              >
                <input
                  id="review-customer-city"
                  {...register("customerCity")}
                  maxLength={100}
                  className={inputCls(!!errors.customerCity)}
                />
              </FormField>
              <FormField
                label="Product"
                htmlFor="review-product"
                error={errors.productId?.message}
                hint="Optional for brand testimonials."
              >
                <select
                  id="review-product"
                  {...register("productId")}
                  className={inputCls(!!errors.productId)}
                  disabled={Boolean(productsError)}
                >
                  <option value="">General brand testimonial</option>
                  {selectedProductId && !products.some(product => product.id === selectedProductId) && (
                    <option value={selectedProductId}>{selectedProductName ?? "Selected product"}</option>
                  )}
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {productsError && (
                  <button
                    type="button"
                    onClick={() => void retryProducts()}
                    className="mt-1 text-xs font-medium text-oxblood hover:underline"
                  >
                    Products could not be loaded. Retry
                  </button>
                )}
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Source"
                  htmlFor="review-source"
                  error={errors.source?.message}
                  required
                >
                  <select
                    id="review-source"
                    {...register("source", { valueAsNumber: true })}
                    className={inputCls(!!errors.source)}
                  >
                    {Object.values(REVIEW_SOURCE).map(source => (
                      <option key={source} value={source}>
                        {REVIEW_SOURCE_LABELS[source]}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField
                  label="Rating"
                  htmlFor="review-rating"
                  error={errors.rating?.message}
                  required
                >
                  <select
                    id="review-rating"
                    {...register("rating", { valueAsNumber: true })}
                    className={inputCls(!!errors.rating)}
                  >
                    {[5, 4, 3, 2, 1].map(rating => (
                      <option key={rating} value={rating}>
                        {rating} star{rating === 1 ? "" : "s"}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </section>

            <section
              className="space-y-5"
              aria-labelledby="review-content-heading"
            >
              <div>
                <h2
                  id="review-content-heading"
                  className="font-display font-semibold"
                >
                  Review Content
                </h2>
                <p className="text-xs text-ink-soft">
                  Add the exact wording approved by the customer.
                </p>
              </div>
              <FormField
                label="Title"
                htmlFor="review-title"
                error={errors.title?.message}
              >
                <input
                  id="review-title"
                  {...register("title")}
                  maxLength={150}
                  className={inputCls(!!errors.title)}
                />
              </FormField>
              <FormField
                label="Comment"
                htmlFor="review-comment"
                error={errors.comment?.message}
                hint="Maximum 2,000 characters."
                required
              >
                <textarea
                  id="review-comment"
                  {...register("comment")}
                  rows={7}
                  maxLength={2_000}
                  className={cn(inputCls(!!errors.comment), "resize-y")}
                />
              </FormField>
              {isEditing && (
                <FormField
                  label="Source Reference"
                  htmlFor="review-source-reference"
                  error={errors.sourceReference?.message}
                  hint="Optional HTTP or HTTPS URL."
                >
                  <input
                    id="review-source-reference"
                    type="url"
                    {...register("sourceReference")}
                    maxLength={500}
                    placeholder="https://..."
                    className={inputCls(!!errors.sourceReference)}
                  />
                </FormField>
              )}
            </section>
          </div>

          <section
            className="mt-8 space-y-5 border-t border-ink/10 pt-7"
            aria-labelledby="review-publication-heading"
          >
            <div>
              <h2
                id="review-publication-heading"
                className="font-display font-semibold"
              >
                Publication
              </h2>
              <p className="text-xs text-ink-soft">
                Control moderation and storefront visibility.
              </p>
            </div>
            <FormField
              label="Status"
              htmlFor="review-status"
              error={errors.status?.message}
              required
            >
              <select
                id="review-status"
                {...register("status", { valueAsNumber: true })}
                className={inputCls(!!errors.status)}
              >
                {Object.values(REVIEW_STATUS).map(reviewStatus => (
                  <option key={reviewStatus} value={reviewStatus}>
                    {REVIEW_STATUS_LABELS[reviewStatus]}
                  </option>
                ))}
              </select>
            </FormField>
            {isEditing && status === REVIEW_STATUS.Rejected && (
              <FormField
                label="Rejection Reason"
                htmlFor="review-rejection-reason"
                error={errors.rejectionReason?.message}
                required
              >
                <textarea
                  id="review-rejection-reason"
                  {...register("rejectionReason")}
                  rows={3}
                  maxLength={500}
                  className={cn(inputCls(!!errors.rejectionReason), "resize-y")}
                />
              </FormField>
            )}
            <div className="grid gap-3 md:grid-cols-3">
              <Controller
                name="hasCustomerConsent"
                control={control}
                render={({ field }) => (
                  <ToggleField
                    label="Customer Consent"
                    description="Required before publishing."
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <ToggleField
                    label="Active"
                    description="Allow storefront visibility."
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Controller
                name="isFeatured"
                control={control}
                render={({ field }) => (
                  <ToggleField
                    label="Featured"
                    description="Show as a highlighted testimonial."
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
            {errors.hasCustomerConsent?.message && (
              <p className="text-xs font-medium text-oxblood">
                {errors.hasCustomerConsent.message}
              </p>
            )}
            {errors.isFeatured?.message && (
              <p className="text-xs font-medium text-oxblood">
                {errors.isFeatured.message}
              </p>
            )}
          </section>
        </div>

        <div className="flex flex-col-reverse gap-3 rounded-card border border-ink/10 bg-ivory px-5 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={goBack}>
            Cancel
          </Button>
          <Button type="submit" disabled={isBusy} className="min-w-44">
            {isBusy ? (
              <>
                <LoaderCircle size={15} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={15} />{" "}
                {isEditing ? "Update Testimonial" : "Create Testimonial"}
              </>
            )}
          </Button>
        </div>
      </form>
      <MessageDialog {...dialog.props} />
    </div>
  );
}
