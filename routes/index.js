// Redis
if (process.env.REDISTOGO_URL) {
	var rtg   = require("url").parse(process.env.REDISTOGO_URL);
	var client = require("redis").createClient(rtg.port, rtg.hostname);

	redis.auth(rtg.auth.split(":")[1]);
} else {
  var client = require("redis").createClient();
}

exports.index = function(req, res){
	var posts_romney;
	var posts_obama;

	client.lrange('post_romney_ids', 0, 20, function(err, ids){
		console.log("Getting posts with ids: " + ids);
		var multi = client.multi();
		for(var k = 0; k < ids.length; k++) {
			multi.hgetall('post:' + ids[k]);
		}
		
		multi.exec(function(err, posts){
			posts_romney = posts;

			client.lrange('post_obama_ids', 0, 20, function(err, ids){
				console.log("Getting posts with ids: " + ids);
				var multi = client.multi();
				for(var k = 0; k < ids.length; k++) {
					multi.hgetall('post:' + ids[k]);
				}

				multi.exec(function(err, posts){
					posts_obama = posts;

					res.render('index', { 
				  	title: 'Politics',
				  	posts_romney: posts_romney,
				  	posts_obama: posts_obama
				  });
				});
				
			});

		});
	});
};

exports.createPost = function(req, res){
	// AJAX
	var person = req.body['post']['person'];
	if(person != 'romney' && person != 'obama') { return; }

	client.incr('post_id');
	client.get('post_id', function(err, reply){
		var post_id = reply;

		// Push to list
		client.lpush('post_' + person + '_ids', post_id);

		// Create post record
		var newPost = {};
		newPost.person = person;
		newPost.side = req.cookies.side;
		newPost.content = req.body['post']['content'];
		client.hmset("post:" + post_id, "person", newPost.person, "side", newPost.side, "content", newPost.content);
	});
};

exports.pickASide = function(req, res) {
	res.render('pick_a_side', {
		title: "Pick a side"
	});
};

exports.setSide = function(req, res){
	var side = req.query['side'];
	res.cookie('side', side);
	res.redirect('/');
};