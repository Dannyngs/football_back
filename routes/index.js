var express = require('express');
var router = express.Router();
var request =require('request');
var cheerio = require('cheerio');
var async = require('async');
var phantom = require('phantom');



var EXPIRETIME =   360

var main_url='http://hk.racing.nextmedia.com/horse1.php?temp_horid=10574';
var horse_url='http://racing.hkjc.com/racing/Info/meeting/RaceCard/';

var draw_url='http://racing.hkjc.com/racing/Info/meeting/Draw/';
var veterinary_url='http://racing.hkjc.com/racing/Info/meeting/VeterinaryRecord/';
var trainer_url = 'http://racing.hkjc.com/racing/Info/trainer/Ranking/';
var jockey_url = 'http://racing.hkjc.com/racing/Info/jockey/Ranking/';

//****Old way to get data of a race 
router.get('/',function(req,res){
    phantom.create().then(function(ph) {
  ph.createPage().then(function(page) {
    page.open('http://score.nowscore.com/1x2/1216866.htm').then(function(status) {
      console.log(status);
        if(status=='fail') res.status(500).send('error')
      page.property('content').then(function(content) {
      
           $ = cheerio.load(content);
          
          var first_row_count=10;
          var sec_row_count=7;
         
          
          var max =Array();
          for(var i=1;i<=first_row_count;i++)
            {
             max.push(parseFloat($('#highFObj').children().eq(i).text()));
            }
          
          var max_ins =Array();
          for(var i=1;i<=sec_row_count;i++)
            {
             max_ins.push(parseFloat($('#highRObj').children().eq(i).text()));
            }
         
           var min =Array();
          for(var i=1;i<=first_row_count;i++)
            {
             min.push(parseFloat($('#lowFObj').children().eq(i).text()));
            }
          
           var min_ins =Array();
          for(var i=1;i<=sec_row_count;i++)
            {
             min_ins.push(parseFloat($('#lowRObj').children().eq(i).text()));
            }
          
           var avg =Array();
          for(var i=1;i<=first_row_count;i++)
            {
             avg.push(parseFloat($('#avgFObj').children().eq(i).text()));
            }
          
           var avg_ins =Array();
          for(var i=1;i<=sec_row_count;i++)
            {
             avg_ins.push(parseFloat($('#avgRObj').children().eq(i).text()));
            }

          
          
        
         
          res.json({max:max,max_ins:max_ins,min:min,min_ins:min_ins,avg:avg,avg_ins:avg_ins});
        page.close();
        ph.exit();
      });
    });
  });

    
    
    
    });
   
})



//New method to get  football race //Derect from HKJC
router.get('/footballRace/:lang',function(req,res){
    var lang=req.params.lang;
    var url_lang='ch',split_lang='對';
    if(lang=='english')
        {
         url_lang='en';
        split_lang='vs';
        }
    phantom.create().then(function(ph) {
  ph.createPage().then(function(page) {
    page.open('http://bet.hkjc.com/football/odds/odds_hdc.aspx?lang='+url_lang).then(function(status) {
      console.log(status);
        if(status=='fail') res.status(500).send('error')
      page.property('content').then(function(content) {
      
           $ = cheerio.load(content);
          
         var raceList=[];
          var trS=$('.cou1.tgCou1');
          trS.each(function(index) {
              

    
              var tdS = $(this).children();
              var race ={};
              race.time=tdS.eq(4).text();
              var raw_teams=tdS.eq(2).text();
              var teams=raw_teams.split(split_lang);
              race.home=teams[0].trim();
              race.away=teams[1].trim();
                raceList.push(race);
    
});
          
        
         
          res.json(raceList);
        page.close();
        ph.exit();
      });
    });
  });

    
    
    
    });
   
})









//****Old way to analyze a race 
router.post('/api/scores',function(req, res) {
	var url = req.body.url || 'http://live1.nowscore.com/odds/match.aspx?id=1002945'

	request(url, function(err, response, html) {
        try{
		if (!err) {
			var $ = cheerio.load(html)
            if(!$('h3'))return console.log('app exits');
			var game_name = $('h3')[0].children[0].data
			console.log(game_name)
			var actual_data = {}
			var table_rows = $('#odds table')[0].children

			var data_begun = -1 // data is only legit on 1 and stays at 1
			var next_is_start_of_new_row = 0
			var current_row = ''
			var count = 0

			for( var i=0; i<table_rows.length; i++ ) {
				var table_cells = table_rows[i].children

				for( var j=0; j<table_cells.length; j++ ) {
					var cell = table_cells[j].children[0]
					
                   
                    if (cell.children) {						
						if (!cell.children.data && cell.children.children) {
							if (cell.children.children.length == 0 ) content = 'DATA SHIT'
							else console.log('is this real life'.inverse, cell.children.children)
						} else if (cell.children[0].data) {
							content = cell.children[0].data
						} else {
							// the 數據 data stuff
							// console.log('why are you so weird'.inverse, cell.children.data, cell.children.children)
						}					
					} else {
						content = cell.data
					}
                        

					if (next_is_start_of_new_row == 1) {
						if (content.trim().length == 0) {
							count = 0 
							continue
						}
						current_row = content
						actual_data[current_row] = []
						next_is_start_of_new_row = false
						count = 0
					} else {
						if (content == '小球' || count > 17) {
							if (data_begun == -1) {
								data_begun++
							} else if (data_begun == 0) {
								data_begun++								
								count = 0
								next_is_start_of_new_row = 1
							} else {
								if (count > 18) {
									next_is_start_of_new_row = 1
								} else {
									count++
								}
							}							
						} else if (data_begun < 1 || content == '主') continue
						else {
							if (content == ' ') content = 0
							actual_data[current_row].push(content)
							count++
						}
					}
					
				}
			}

			// console.log(actual_data)

			var result_obj = {
				data: actual_data,
				name: game_name
			}

			// console.log('return result_obj', result_obj)

			return res.send(200, result_obj)
		}
            return res.status(500).send('error')
            }catch(e){
                return res.status(401).send('Not Data Right Now')
                console.log('catched an error: '+e)
               
            }
	})
});







/* socket.io setting */
   
   io.on('connection', function(socket){
       var ip=socket.request.connection.remoteAddress;
       var socid=socket.id;
      
       
       console.log(socid+': Visiter Showed')
     
       socket.on('login', function(user){
          console.log(socid+': Trying to login  : '+user.username);
           
          //Step 1 : check with databases
       var username=user.username;
        var password=user.password;
    
    db.users.findOne({username:username,password:password},function(err,user){
           
           if(err) return socket.emit('loginfailed',{msg:err});
           if(!user)return socket.emit('loginfailed',{msg:"Incorrect login infomation"});
            if(user.role!='admin'){
               
            //Step 2 : check if loged in 
            
            db.current_users.findOne({userkey:user.username},function(err,keylog){
                if(err) return socket.emit('loginfailed',{msg:err});
                             

                if(keylog)//if there's multiple login
                {               

                    db.multiplelogin.insert(
                        {ip:ip,username:user.username,date:new Date()},
                        function(err){});
                    console.log(socid+': Mutilple Login Occured: '+user.username)
                    return socket.emit('loginfailed',{msg:"This account is currently being used"}); 
                
                }
                
                //Step 3 : passed!
                var expireTime = new Date();
                expireTime.setMinutes(expireTime.getMinutes() + EXPIRETIME);
                db.current_users.insert({userkey:user.username,expireAt:expireTime,date:new Date(),socid:socid},function(err){
                if(err)console.log(err);
                 //iouser=user;
                    console.log(socid+': User loged in : '+user.username)
                    socket.emit('loginok',user)
                      
                })              
            
            
            })
           
            
           }else{
                return  socket.emit('loginok',user)
            }
            
            
            
       })
    
     
          
      
      
     
      
      
      
     
  }); //end of socket login    
       
       socket.on('logout',function(sid){
           
           db.current_users.remove({socid:socid},function(err){
            if(err)return socket.emit('logoutfailed',err);
         console.log(socid+': user logout ')
          return socket.emit("logoutok",'log out ok!');
           
       }) 
       })
       
       socket.on('disconnect', function(){

      
       db.current_users.remove({socid:socid},function(err,rs){
           if(err)console.log(err);
           
              if(!rs.result.n)
               return console.log(socid+': Visiter left ');
           console.log(socid+': User left ');
           
           
       }) 
       
  });
   
   });  
    




module.exports = router;
