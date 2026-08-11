import { CryptoService } from "@/services/cryptoService";

export function getDataFromLocalStorage(key: string): any {
  try {
    const sessionEncryptData = localStorage.getItem(key);
    if (sessionEncryptData === null) {
      throw new Error("Invalid Session Key");
    }
    const decryptStrData = CryptoService.decrypt(sessionEncryptData);
    return JSON.parse(decryptStrData);
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export function storeDataToLocalStorage(key: string, data: any) {
  try {
    if (data === undefined || data === null || data === "") {
      throw new Error("Provide valid data to store in session");
    }
    const stringifyData = JSON.stringify(data);
    const encryptedData = CryptoService.encrypt(stringifyData);
    localStorage.setItem(key, encryptedData);
    return;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
