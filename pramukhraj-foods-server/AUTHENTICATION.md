# Customer passwordless authentication

Customer authentication uses an E.164 mobile number and a six-digit, single-use OTP. Access tokens last 24 hours and are returned to the browser; opaque refresh tokens last 30 days, are stored only as SHA-256 hashes, rotated on every use, and sent in an HTTP-only SameSite cookie.

## Production configuration

Keep secrets out of `appsettings.json`. Supply these values through the deployment secret store or environment variables:

```text
CustomerOtp__HashPepper=<at-least-32-random-characters>
CustomerOtp__Twilio__AccountSid=<account-sid>
CustomerOtp__Twilio__AuthToken=<auth-token>
CustomerOtp__Twilio__FromNumber=<e164-sender-number>
```

The application refuses to start without a sufficiently long OTP pepper. Production refresh cookies are `HttpOnly`, `Secure`, `SameSite=Strict`, and scoped to `/api/auth/customer`. Keep the storefront and API on the same registrable site, terminate TLS at the edge, configure the exact storefront origin in `Cors:AllowedOrigins`, and register any required Indian DLT sender/template before live traffic.

Twilio Programmable Messaging is the only OTP delivery implementation. Live SMS delivery requires valid Twilio credentials and an account permitted to send the configured message body.

Apply the schema change with:

```sh
dotnet ef database update --project pramukhraj/pramukhraj.csproj --startup-project pramukhraj/pramukhraj.csproj
```

The migration preserves existing names and emails before removing password columns. Legacy customers receive a non-login placeholder mobile number and must have a real mobile number verified before passwordless access.
