DROP TABLE public."user";

CREATE TABLE public."user"
(
    id serial PRIMARY KEY,
    username varchar(20) NOT NULL,
    email varchar(50) NOT NULL,
    password varchar(60),
    salt varchar(8)
);
CREATE UNIQUE INDEX user_email_uindex ON public."user" (email);