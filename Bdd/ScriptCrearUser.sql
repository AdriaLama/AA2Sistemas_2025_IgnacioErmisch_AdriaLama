

select * from User;
 -- Select permet fer preguntes a database
 
 insert into User(username, password) values ("User1", "1234"); 
 
 select * from User;
 
 insert into User(username, password) values ("User2", "1234");
 
 update User set password = "4321" where id = 1;
 
 select * from User;
 
 insert into User(username,password) values("pepe", "user");
 
 select * from User where username = "pepe" and password = "user";
 select id from User where username = "pepe" and password = "user";
 select count(*) from User where username = "pepe" and password = "user";
 select count(*) as existinUsers from User where username = "pepe" and password = "user";