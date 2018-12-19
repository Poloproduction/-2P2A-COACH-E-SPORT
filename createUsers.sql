create table users
(
  id        uuid      not null
    constraint users_pkey
      primary key,
  firstname char(64),
  lastname  char(64),
  email     char(128) not null,
  password  char(60),
  birthday  date,
  iam       char(64) default 'Amateur'::bpchar,
  pseudo    char(64),
  city      char(64),
  weapon    char(64)
);

alter table users
  owner to postgres;

create unique index users_email_uindex
  on users (email);
