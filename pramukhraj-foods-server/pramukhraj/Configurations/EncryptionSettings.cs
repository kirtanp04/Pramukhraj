namespace pramukhraj.Configurations
{
    public class EncryptionSettings
    {
        public bool Enabled { get; set; } = false;
        public string ApiPathPrefix { get; set; } = "/api";
        public string? Key { get; set; }
    }
}
