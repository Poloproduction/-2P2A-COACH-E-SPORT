CREATE TABLE users
(
    id uuid NOT NULL CONSTRAINT users_pkey PRIMARY KEY,
    firstname CHAR(64),
    lastname  CHAR(64),
    email     CHAR(128),
    password  CHAR(60)
);

CREATE UNIQUE INDEX users_email_uindex ON public.users (email);