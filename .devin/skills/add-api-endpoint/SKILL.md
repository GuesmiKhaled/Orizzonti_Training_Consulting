---
name: add-api-endpoint
description: Generates a new REST API endpoint in the .NET Core backend.
argument-hint: "[entity] [httpMethod]"
allowed-tools:
  - read
  - grep
  - glob
  - exec
---

You are an expert .NET Core developer. Your task is to generate a new API endpoint for the entity specified in the argument.

1.  Locate the existing API controllers in the `src/MyApp.Api/Controllers` directory.
2.  Create a new controller or add to an existing one based on the entity name provided.
3.  Implement the endpoint using the specified HTTP method (GET, POST, PUT, DELETE).
4.  Ensure the endpoint uses the service layer, not direct database access.
5.  Add appropriate unit tests in the `tests/MyApp.Api.Tests` project.