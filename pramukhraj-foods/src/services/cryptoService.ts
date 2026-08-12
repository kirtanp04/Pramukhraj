import CryptoJS from "crypto-js";

export class CryptoService {
  protected static Key: string = import.meta.env.VITE_CRYPTO_KEY;

  static encrypt(plainText: string): string {
    try {
      
      const SECRET_KEY = CryptoJS.enc.Utf8.parse(this.Key);
      const iv = CryptoJS.lib.WordArray.random(16);
      const encrypted = CryptoJS.AES.encrypt(plainText, SECRET_KEY, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      const ivAndCiphertext = iv.clone().concat(encrypted.ciphertext);
      return CryptoJS.enc.Base64.stringify(ivAndCiphertext);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  static decrypt(base64Encoded: string): string {
    try {
      const SECRET_KEY = CryptoJS.enc.Utf8.parse(this.Key);
      const encryptedData = CryptoJS.enc.Base64.parse(base64Encoded);
      const iv = CryptoJS.lib.WordArray.create(
        encryptedData.words.slice(0, 4),
        16
      );
      const ciphertext = CryptoJS.lib.WordArray.create(
        encryptedData.words.slice(4),
        encryptedData.sigBytes - 16
      );
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: ciphertext,
      });
      const decrypted = CryptoJS.AES.decrypt(cipherParams, SECRET_KEY, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error: any) {
      throw new Error(error);
    }
  }
}
