using Fido2NetLib;
using Fido2NetLib.Objects;
using Microsoft.Extensions.Configuration;

namespace GtuAttendance.Infrastructure.Services;

public class Fido2Service
{
    private readonly IFido2 _fido2;
    private readonly string _origin;

    private readonly string _rpId;

    public Fido2Service(IConfiguration configuration)
    {
        _origin = configuration["Fido2:Origin"] ?? "https://localhost:7000";
        _rpId = configuration["Fido2:RpId"] ?? "localhost";

        _fido2 = new Fido2(new Fido2Configuration
        {
            ServerDomain = _rpId,
            ServerName = "GTU Attendance System",
            Origins = new HashSet<string> { _origin },
        });

    }

    public CredentialCreateOptions CreateCredentialOptions(
        Guid userId,
        string username,
        string displayName,
        IEnumerable<PublicKeyCredentialDescriptor>? excludeCredentials = null
    )
    {
        var user = new Fido2User
        {
            Id = userId.ToByteArray(),
            Name = username,
            DisplayName = displayName
        };

        var request = new RequestNewCredentialParams
        {
            User = user,
            ExcludeCredentials = excludeCredentials?.ToList(),
            AuthenticatorSelection = new AuthenticatorSelection
            {
                AuthenticatorAttachment = AuthenticatorAttachment.Platform,  // cross platformdan cıkardım
                ResidentKey = ResidentKeyRequirement.Discouraged,
                UserVerification = UserVerificationRequirement.Required
            },
            AttestationPreference = AttestationConveyancePreference.None,
            Extensions = new AuthenticationExtensionsClientInputs
            {
                UserVerificationMethod = true
            },
            PubKeyCredParams = new List<PubKeyCredParam>
            {
                new PubKeyCredParam(COSE.Algorithm.ES256, PublicKeyCredentialType.PublicKey),
                new PubKeyCredParam(COSE.Algorithm.RS256, PublicKeyCredentialType.PublicKey)
            }
        };
        return _fido2.RequestNewCredential(request);
    }

    public Task<RegisteredPublicKeyCredential> VerifyAttestationAsync(
        AuthenticatorAttestationRawResponse attestationRawResponse,
        CredentialCreateOptions originalOptions,
        IsCredentialIdUniqueToUserAsyncDelegate isCredentialIdUniqueToUser,
        CancellationToken cancellationToken = default
    )
    {
        var request = new MakeNewCredentialParams
        {
            AttestationResponse = attestationRawResponse,
            OriginalOptions = originalOptions,
            IsCredentialIdUniqueToUserCallback = isCredentialIdUniqueToUser

        };

        return _fido2.MakeNewCredentialAsync(request, cancellationToken);

    }

    public AssertionOptions CreateAssertionOptions(
        IEnumerable<PublicKeyCredentialDescriptor>? allowedCredentials = null,
        UserVerificationRequirement userVerification = UserVerificationRequirement.Required
    )
    {
        var request = new GetAssertionOptionsParams
        {
            AllowedCredentials = allowedCredentials?.ToList(),
            UserVerification = userVerification,
            Extensions = new AuthenticationExtensionsClientInputs
            {
                UserVerificationMethod = true
            }
        };

        return _fido2.GetAssertionOptions(request);

        
    }



    public Task<VerifyAssertionResult> VerifyAssertionAsync(
        AuthenticatorAssertionRawResponse assertionRawResponse,
        AssertionOptions originalOptions,
        byte[] storedPublicKey,
        uint storedSignatureCounter,
        IsUserHandleOwnerOfCredentialIdAsync? userHandleOwnerCheck = null,
        CancellationToken cancellationToken = default
    )
    {
        var request = new MakeAssertionParams
        {
            AssertionResponse = assertionRawResponse,
            OriginalOptions = originalOptions,
            StoredPublicKey = storedPublicKey,
            StoredSignatureCounter = storedSignatureCounter,
            IsUserHandleOwnerOfCredentialIdCallback = userHandleOwnerCheck
        };

        return _fido2.MakeAssertionAsync(request, cancellationToken);
    }


}