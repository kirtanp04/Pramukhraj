using System.Security.Cryptography;
using System.Text;

namespace pramukhraj.Services
{
    public class Crypto
    {
        private readonly byte[] _key;

        public Crypto(string? secretKey)
        {
            // Key must be exactly 32 bytes (256 bits)
            if (string.IsNullOrEmpty(secretKey) || secretKey.Length != 32)
            {
                throw new ArgumentException("Secret key must be exactly 32 characters long.");
            }

            _key = Encoding.UTF8.GetBytes(secretKey);
        }

        public string Encrypt(string plainText)
        {
            using var aes = Aes.Create();
            aes.Key = _key;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            // Generate a fresh random IV for every encryption
            aes.GenerateIV();

            using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
            using var ms = new MemoryStream();

            // Write the 16-byte IV to the beginning of the memory stream
            ms.Write(aes.IV, 0, aes.IV.Length);

            using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
            using (var sw = new StreamWriter(cs))
            {
                sw.Write(plainText);
            }

            return Convert.ToBase64String(ms.ToArray());
        }

        public string Decrypt(string cipherText)
        {
            cipherText = cipherText.Replace(" ", "+");

            var fullCipher = Convert.FromBase64String(cipherText);

            using var aes = Aes.Create();
            aes.Key = _key;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            // Extract the 16-byte IV from the front of the array
            var iv = new byte[16];
            Array.Copy(fullCipher, 0, iv, 0, iv.Length);
            aes.IV = iv;

            // Create a memory stream starting AFTER the IV
            using var ms = new MemoryStream(fullCipher, iv.Length, fullCipher.Length - iv.Length);
            using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
            using var sr = new StreamReader(cs);

            return sr.ReadToEnd();
        }
    }
}
