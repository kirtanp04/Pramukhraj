export interface CustomerAddress {
  id: string;
  recipientName: string;
  mobileNumber: string;
  email: string | null;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: "Home" | "Work" | "Other";
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  concurrencyStamp: string;
  createdOn: string;
  updatedOn: string;
}

export interface AddressInput {
  recipientName: string;
  mobileNumber: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: "Home" | "Work" | "Other";
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  concurrencyStamp?: string;
}
