create table team
(
  id         uuid      not null
    constraint team_pk
      primary key,
  coach_email char(128) not null,
  name       char(64)  not null,
  offer  integer
);

create table team_users
(
  team_id uuid not null,
  user_id uuid not null,
  primary key(team_id, user_id)
);

alter table team
  owner to postgres;

alter table team_users
  owner to postgres;

create unique index team_id_uindex
  on team (id);

create unique index team_name_uindex
  on team (name);
