# TaskFlowWeb

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Dashboard persistence API

The dashboard loads available Todos through the existing projects/tasks/Todos API and reads and saves their priority and order using:

- `GET /api/users/{userId}/dashboard` returning `[{ "todoId": 1, "taskId": 2, "priority": "low", "position": 0 }]`
- `PUT /api/users/{userId}/dashboard` accepting `{ "todos": [{ "todoId": 1, "taskId": 2, "priority": "low", "position": 0 }] }`

The server must validate that each Todo belongs to the user and persist the Todo assignment, priority, and position in its database. The API project is not part of this repository, so these endpoints must be implemented by the backend; until then the dashboard reports loading/saving errors rather than claiming the settings were persisted.

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
