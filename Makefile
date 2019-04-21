.PHONY: destroy deploy invalidate listinvalidations test destroy

destroy:
	./node_modules/.bin/serverless remove --aws-profile 0xproject

deploy:
	./node_modules/.bin/serverless deploy --aws-profile 0xproject
	CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID}" node deploy.js
	CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID}" node create-invalidation.js

invalidate:
	CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID}" node create-invalidation.js

listinvalidations:
	aws cloudfront list-invalidations --distribution-id "" | head

test:
	DEBUG=prerendercloud PRERENDER_SERVICE_URL="https://service.prerender.cloud" ./node_modules/jasmine/bin/jasmine.js
