export default class LoginModel
{
    constructor(userName,password) {
        this.userName = userName;
        this.password = password;
        this.errorMessage = "";
    }

    updateModel(field, value)
    {
        switch(field)
        {
            case "username":
                this.updateUserName(value);
                break;
            case "password":
                this.updatePassword(value);
                break;
            default:
                break;
        }
    }

    updateUserName(value)
    {
        this.userName = value;
    }

    updatePassword(value)
    {
        this.password = value;
    }

    updateErrorMessage(value)
    {
        this.errorMessage = value;
        console.log(this.errorMessage);
    }
}
