-- Run this SQL in your Neon console to create the tables

CREATE TYPE "Category" AS ENUM ('TASKS', 'TESTS', 'PRACTISE', 'REVISION');
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  category    "Category" NOT NULL DEFAULT 'TASKS',
  priority    "Priority" NOT NULL DEFAULT 'MEDIUM',
  "dueDate"   TIMESTAMP,
  completed   BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
