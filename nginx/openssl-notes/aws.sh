# Turn godaddy certs into format AWS/ELB likes
# viblio.csr was generated with openssl (see gen-csr.txt)
# viblio.crt, gd_bundle*.crt from godaddy after re-key

# define these
crtdomain="viblio"
crtchain="gd_bundle-g2-g1.crt"

echo "converting to pem format"
openssl rsa -in ${crtdomain}.key -out aws-${crtdomain}.key
openssl x509 -in ${crtdomain}.crt -out aws-${crtdomain}.crt -outform PEM

echo "uploading certificate ${crtdomain} to Amazon"
aws iam upload-server-certificate \
--certificate-body file://aws-${crtdomain}.crt \
--private-key file://aws-${crtdomain}.key \
--certificate-chain file://${crtchain} \
--server-certificate-name ViblioNew