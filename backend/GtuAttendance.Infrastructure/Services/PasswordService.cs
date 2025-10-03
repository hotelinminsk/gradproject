using System.Security.Cryptography;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
namespace GtuAttendance.Infrastructure.Services;


public class PasswordService
{
    public string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(128 / 8);

        string hashed = Convert.ToBase64String(KeyDerivation.Pbkdf2(
            password: password,
            salt: salt,
            prf: KeyDerivationPrf.HMACSHA256,
            iterationCount: 100000,
            numBytesRequested: 256 / 8
            ));

        return $"{Convert.ToBase64String(salt)}.{hashed}";
    }


    public bool VerifyPassword(string password, string hashed)
    {
        try
        {
            var parts = hashed.Split(".");
            if (parts.Length != 2) return false;
            var salt = Convert.FromBase64String(parts[0]);
            var hash = parts[1];

            string check = Convert.ToBase64String(KeyDerivation.Pbkdf2(
                password: password,
                salt: salt,
                prf: KeyDerivationPrf.HMACSHA256,
                iterationCount: 100000,
                numBytesRequested: 256 / 8
                
            ));

            return hash.Equals(check);


        }catch {  return false; }

    }
}