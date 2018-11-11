create table users
(
  id        uuid not null
    constraint users_pkey
    primary key,
  firstname char(64),
  lastname  char(64),
  email     char(128),
  password  char(60)
);
