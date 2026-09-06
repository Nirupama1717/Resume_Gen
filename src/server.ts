import { app } from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(
    `resume-rag-backend listening on http://localhost:${env.port}`
  );
});
