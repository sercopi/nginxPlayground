#!/bin/bash
#if jwt exists, there are already ssh keypair credentials created,
#so there is no need to create them again, if it doesnt exist, they are created
if [ ! -d "/app/auth/jwt" ];
    then mkdir "/app/auth/jwt"
    #password is to be replaces with a docker env variable later
    chmod -R 777 auth
    openssl genrsa -aes128 -out ./auth/jwt/private.pem -passout pass:password 3072
    openssl pkey  -in auth/jwt/private.pem -out auth/jwt/public.pem -pubout -passin pass:password
fi
npm run start-dev