create table team
(
  id         uuid      not null
    constraint team_pk
      primary key,
  coachemail char(128) not null,
  name       char(64)  not null,
  nbmembers  integer
);

alter table team
  owner to postgres;

create unique index team_id_uindex
  on team (id);

create unique index team_name_uindex
  on team (name);
