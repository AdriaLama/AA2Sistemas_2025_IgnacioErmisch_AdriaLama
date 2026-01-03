USE `mydb`;

drop procedure if exists CreateUser;

delimiter //

create procedure Createuser
	(newusername varchar(45), newPassword varchar(45))
mainFunc:begin

	declare existingusers int default 0;
    
    if newUsername = "" or newPassword = "" then
		select "User or Password can't be blank or null" as error;
        leave mainFunc;
    end if;
    
    select count(*) into existingUsers from User where User.username = newUsername;
    
    if existingusers != 0 then
		select "This username exist" as error;
        leave mainFunc;    
    end if;
    
    insert into User(username, password) values(newUsername, newPassword);
    
    select count(*) into existingUsers from User where User.username = newUsername;
    
    if existingusers = 0 then
		select "This creating user" as error;
        leave mainFunc;    
    end if;
    
    select "User Created Succesfully" as succes;
    
end//