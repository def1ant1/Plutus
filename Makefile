SPECTRAL := pnpm exec spectral
ASYNCAPI := pnpm exec asyncapi
REDOCLY := pnpm exec redocly
NODE := node
OPENAPI_SPECS := $(wildcard contracts/http/*.openapi.yaml)
ASYNCAPI_SPEC := contracts/events/lifecycle.asyncapi.yaml
AVRO_SCHEMAS := $(wildcard contracts/events/schemas/*.avsc)
ARTIFACT_ROOT := contracts/artifacts
HTTP_ARTIFACT_DIR := $(ARTIFACT_ROOT)/http
EVENT_ARTIFACT_DIR := $(ARTIFACT_ROOT)/events

.PHONY: contracts-openapi-validate contracts-asyncapi-validate contracts-avro-validate contracts-validate contracts-openapi-docs contracts-asyncapi-docs contracts-docs clean-contract-artifacts

contracts-openapi-validate:
	@echo "Linting OpenAPI specs with Spectral"
	$(SPECTRAL) lint $(OPENAPI_SPECS) --ruleset .spectral.yaml

contracts-asyncapi-validate:
	@echo "Validating AsyncAPI spec"
	$(ASYNCAPI) validate $(ASYNCAPI_SPEC)

contracts-avro-validate:
	@echo "Validating Avro schemas for structural + compatibility guarantees"
	$(NODE) tools/scripts/validate-avro.mjs $(AVRO_SCHEMAS)

contracts-validate: contracts-openapi-validate contracts-asyncapi-validate contracts-avro-validate
	@echo "All contract validations passed"

contracts-openapi-docs: $(HTTP_ARTIFACT_DIR)
	@for spec in $(OPENAPI_SPECS); do \
	name=$$(basename $$spec .openapi.yaml); \
	$(REDOCLY) build-docs $$spec --output $(HTTP_ARTIFACT_DIR)/$$name.html; \
	$(NODE) tools/scripts/html-to-pdf.mjs $(HTTP_ARTIFACT_DIR)/$$name.html $(HTTP_ARTIFACT_DIR)/$$name.pdf; \
	done

contracts-asyncapi-docs: $(EVENT_ARTIFACT_DIR)
	@echo "Rendering AsyncAPI documentation"
	@node tools/scripts/render-asyncapi-html.mjs $(ASYNCAPI_SPEC) $(EVENT_ARTIFACT_DIR)/lifecycle.html
	@node tools/scripts/html-to-pdf.mjs $(EVENT_ARTIFACT_DIR)/lifecycle.html $(EVENT_ARTIFACT_DIR)/lifecycle.pdf

contracts-docs: contracts-openapi-docs contracts-asyncapi-docs
	@echo "Contract documentation generated under $(ARTIFACT_ROOT)"

$(HTTP_ARTIFACT_DIR):
	@mkdir -p $(HTTP_ARTIFACT_DIR)

$(EVENT_ARTIFACT_DIR):
	@mkdir -p $(EVENT_ARTIFACT_DIR)

clean-contract-artifacts:
	rm -rf $(ARTIFACT_ROOT)
