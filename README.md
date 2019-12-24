# Purpose

This repo serves as the starting point for deployment tool which deploys on SC and CC at once.

## Service Cloud Open Issues

- Use the JWT based auth, currently web based auth is used.
- The current service cloud connector repo uses the ant based deployment. Here we are using the 'Salesforce DX Development model', this requires changes in the code base structure also.
- The force:mdapi:deploy SC command errors out because of the payload limitation -- this can be resolved by breaking down the code in chunks while deployment.

## Commerce Cloud Open Issues

- Use the auth using the secret, as of now web based auth is used(auth:login).
