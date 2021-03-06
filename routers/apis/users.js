// 注册和登录实现接口
const express = require('express');
const router = express.Router();

const User = require('../../models/User');   // 引入model
const bcrypt = require('bcrypt');   // 引入加密
const gravatar = require('gravatar');  // 引入默认头像
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');


// $route GET api/users/test
// @desc   返回请求的json数据
// @access public
// router.get("/test", (req, res) => {
//     res.json({
//         msg: 'login works'
//     })
// });




// $route POST api/users/register （解析post需要安装body-parser）
// @desc   返回请求的json数据
// @access public
router.post("/register", (req, res) => {
    // console.log(req.body);
    // 查询数据库中是否有邮箱
    User.findOne({email:req.body.email})
        .then((user) => {
            if (user) {
                return res.status(400).json("邮箱已被占用！");
            } else {
                const avatar = gravatar.url(req.body.email, {s:'200',r:'pg',d:'mm'});
                const newUser = new User({
                    name: req.body.name,
                    email: req.body.email,
                    avatar,
                    password: req.body.password,
                    identity: req.body.identity,
                })

                bcrypt.genSalt(10, function(err, salt) {
                    bcrypt.hash(newUser.password, salt, function(err, hash) {
                        if (err) throw err;

                        newUser.password = hash;
                        newUser.save()
                               .then(user => res.json(user))
                               .catch(err => console.log(err))
                    })
                })
            };
        })
})



// $route POST api/users/login 
// @desc   返回token
// @access public
router.post('/login', (req, res) => {
    const email = req.body.email;
    const pwd = req.body.password;

    // 查询数据
    User.findOne({email})
        .then(user => {
            if (!user) {
                return res.status(404).json('该用户不存在！');
            }

            // 密码匹配
            bcrypt.compare(pwd, user.password)
                  .then(isMatch => {
                    if (isMatch) {
                    //  jwt.sign("规则","加密名字","过期时间","箭头函数")
                        const rule = {
                            id:user.id, 
                            email:user.email,
                            avatar: user.avatar,
                            identity: user.identity,
                        };
                        jwt.sign(rule, keys.secret, {expiresIn:3600}, (err, token) => {
                            if (err) throw err;
                            res.json({
                                success:true,
                                token: "Bearer " + token,
                            })
                        });
                        // res.json({msg:"success"});
                    } else {
                        return res.status(400).json("密码错误！");
                    }
                  })
        })
})


// $route GET api/users/info 
// @desc   返回当前信息
// @access public
router.get('/info', passport.authenticate('jwt', {session:false}), (req, res) => {
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        identity: req.user.identity,
    });
})


module.exports = router;
