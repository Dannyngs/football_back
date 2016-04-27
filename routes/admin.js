var express = require('express');
var router = express.Router();
var jwt    = require('jsonwebtoken');
ObjectId = require('mongoskin').ObjectID

/* GET users listing. */
var defaultPageCount=100;

router.post('/api/login',function(req, res) {

     db.users.find({username:req.body.id,password:req.body.password,role:'admin'}).toArray(function(err,users){

console.log(users);
        if(err)return res.status(500).json(err);
        if(users.length>0){
             var token = jwt.sign(req.body.id,'iamdanny', {
          expiresInMinutes: 1440 });// expires in 24 hours
            return res.json({rs:'login ok',token:token});
        }else
           return res.status(401).json({rs:'fail to login '});




    })








  });

/*
router.get('/api/usercount',function(req,res,next){


    db.users.find().count(function(err,count){

        if(err)return res.status(500).json(err);





        res.json({count:count});
    })

})
*/



router.get('/api/users/:pnum/:count',isAdminAuthed,function(req,res,next){

    var page_number= parseInt(req.params.pnum);
    var count= parseInt(req.params.count);
  
     db.users.find().count(function(err,total_count){//GET COUNT

        if(err)return res.status(500).json(err);

         db.users.find().skip(page_number).limit(count).sort({ username: -1 }).toArray(function(err,users){//GET USERS

        if(err)return res.status(500).json(err);





        res.json({users:users,total_count:total_count});
    })



    })


    

})


router.get('/api/users/:keyword',isAdminAuthed,function(req,res,next){

    var keyword= req.params.keyword;
  
    
    db.users.find({$or: [ { username:{$regex: keyword}}, {note:{$regex: keyword}} ]}).limit(defaultPageCount).sort({ username: -1 }).toArray(function(err,users){

        if(err)return res.status(500).json(err);





        res.json(users);
    })

})



router.delete('/api/users/:id',isAdminAuthed,function(req,res,next){

    db.users.remove({_id: ObjectId(req.params.id)},function(err){

        if(err)return res.status(500).json(err);

         db.users.find().limit(defaultPageCount).sort({ username: -1 }).toArray(function(err,users){

             if(err)return res.status(500).json(err);


               res.json(users);
          })
    })

})


router.post('/api/users',isAdminAuthed,function(req,res,next){

    var user=req.body
    user.registeredOn=new Date()
    db.users.insert(req.body,function(err){

        if(err)return res.status(500).json(err);

          db.users.find().limit(defaultPageCount).sort({ username: -1 }).toArray(function(err,users){

             if(err)return res.status(500).json(err);


               res.json(users);
          })










    })

})

router.put('/api/users/:id',isAdminAuthed,function(req,res,next){

    db.users.update({_id:ObjectId(req.params.id)},{$set:{password:req.body.password,salePrice:req.body.salePrice,note:req.body.note}},function(err){

        if(err)return res.status(500).json(err);

         db.users.find().limit(defaultPageCount).sort({ username: -1 }).toArray(function(err,users){

             if(err)return res.status(500).json(err);


               res.json(users);
          })
    })

})


router.get('/api/onlineusers',isAdminAuthed,function(req,res,next){

    db.current_users.find().toArray(function(err,users){

        if(err)return res.status(500).json(err);

        res.json(users);
    })

})

router.delete('/api/onlineusers/:id',isAdminAuthed,function(req,res,next){

    console.log(req.params.id);
    db.current_users.remove({_id: ObjectId(req.params.id)},function(err){

        if(err)return res.status(500).json(err);

        res.send("Done!");
    })

})

router.get('/api/multiplelogin',isAdminAuthed,function(req,res,next){

    db.multiplelogin.find().sort( { username: 1 } ).toArray(function(err,logins){

        if(err)return res.status(500).json(err);

        res.json(logins);

    })

})

router.delete('/api/multiplelogin',isAdminAuthed,function(req,res,next){

    db.multiplelogin.remove({},function(err){

         res.status(200).send("Done!");
    })
    if(err)return res.status(500).json(err);


})




router.get('/api/dayTotal',isAdminAuthed,function(req,res,next){

    //get this month
    var thisMonth =new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0,0,0,0);
    var nextMonth = new Date();
    nextMonth.setDate(1);
    nextMonth.setHours(0,0,0,0);
    nextMonth.setMonth(nextMonth.getMonth()+1);



    //get today
    var today = new Date();
    today.setHours(0,0,0,0);
    var tomorrow = new Date();
    tomorrow.setHours(0,0,0,0);
    tomorrow.setDate(today.getDate()+1);


    db.users.find({registeredOn:{$lt:tomorrow,$gte:today}}).toArray(function(err,users){

        if(err)return res.status(500).json(err);

        var totalcost=0;
            for(var i=0;i<users.length;i++)
                {
                    totalcost+=users[i].salePrice||0;

                }


        res.json({daytotal:totalcost});
    })

})


router.get('/api/monthTotal',isAdminAuthed,function(req,res,next){

    //get this month
    var thisMonth =new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0,0,0,0);
    var nextMonth = new Date();
    nextMonth.setDate(1);
    nextMonth.setHours(0,0,0,0);
    nextMonth.setMonth(nextMonth.getMonth()+1);





    db.users.find({registeredOn:{$lt:nextMonth,$gte:thisMonth}}).toArray(function(err,users){

        if(err)return res.status(500).json(err);

        var totalcost=0;
            for(var i=0;i<users.length;i++)
                {

                    totalcost+=users[i].salePrice||0;

                }


        res.json({monthtotal:totalcost});
    })

})


router.get('/api/rangetotal/:from/:todate',isAdminAuthed,function(req,res,next){

        var toDate=new Date(req.params.todate);
        toDate.setDate(toDate.getDate()+1);






    db.users.find({registeredOn:{$lt:toDate,$gte:new Date(req.params.from)}}).toArray(function(err,users){

        if(err)return res.status(500).json(err);

        var totalcost=0;
            for(var i=0;i<users.length;i++)
                {

                    totalcost+=users[i].salePrice||0;

                }


        res.json({totalcost:totalcost,users:users});
    })

})



function isAdminAuthed(req,res,next){

      // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token,'iamdanny', function(err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;

          next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(401).json({
        success: false,
        message: 'No token provided.'
    });

  }
}
module.exports = router;
