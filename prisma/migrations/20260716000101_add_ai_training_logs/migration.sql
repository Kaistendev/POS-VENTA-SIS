-- CreateTable
CREATE TABLE "ai_training_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" INTEGER NOT NULL,
    "mensaje_usuario" TEXT NOT NULL,
    "nlu_output" TEXT,
    "respuesta_sistema" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_training_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ai_training_logs_usuario_id_idx" ON "ai_training_logs"("usuario_id");

-- CreateIndex
CREATE INDEX "ai_training_logs_created_at_idx" ON "ai_training_logs"("created_at");
