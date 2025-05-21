package knowchain.server.controller;


import knowchain.common.result.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user")
@Slf4j
public class LoginLogoutController {

    @GetMapping("/test")
    public String Test(){
        return "测试成功";
    }

    @GetMapping("/test1")
    public Result<String> Test1(){
        return Result.success("test1测试成功");
    }
}
