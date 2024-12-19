const express = require('express');
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


//middleware
app.use(cors({
	origin: ['http://localhost:5176'],
	credentials: true
}));
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j0hxo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

	//jwt auth related apis
	app.post('/jwt', async(req, res)=>{
		const user = req.body;
		const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h'});
		res
		.cookie('token', token, {
			httpOnly: true,
			secure: false, // http://localhost:5176/signIn
		})
		
		.send({ success: true});
	})



	//jobs related apis 
	const jobsCollection = client.db('jobPortal2').collection('jobs2');
	const jobApplicationCollection = client.db('jobPortal2').collection('job_application2')


	//jobs related apis
	app.get('/jobs' , async(req, res)=>{

		const email = req.query.email;
		let query = {};
		if(email){
			query = { hr_email: email}
		}

		const cursor = jobsCollection.find(query);
		const result = await cursor.toArray();
		res.send(result);
	})

	//specific job data load 'job details button'
	app.get('/jobs/:id', async(req, res)=>{
		const id = req.params.id;
		const query = { _id: new ObjectId(id)};
		const result = await jobsCollection.findOne(query);
		res.send(result);
	})

	//create post add job button
	app.post('/jobs', async(req, res) =>{
		const newJob = req.body;
		const result = await jobsCollection.insertOne(newJob);
		res.send(result);
	})


	//job application find specific email data
	app.get('/job-application', async(req, res) =>{
		const email = req.query.email;
		const query = {applicant_email: email};

		console.log('cuk cuk cuk', req.cookies);
		
		const result = await jobApplicationCollection.find(query).toArray();

		//fokira way to aggregate data
		for(const application of result){
			console.log(application.job_id);
			const query1 = { _id: new ObjectId(application.job_id)};
			const job = await jobsCollection.findOne(query1);
			if(job){
				application.title = job.title;
				application.company = job.company;
				application.company_logo = job.company_logo;
			}
		}
		res.send(result);
	})

	// app.get('/job-applications/:id') => get specific job application by id 
	app.get('/job-applications/jobs/:job_id', async(req, res)=>{
		const jobId = req.params.job_id;
		const query = { job_id: jobId};
		const result = await jobApplicationCollection.find(query).toArray();
		res.send(result);
	})

	//job application collection apis
	app.post('/job-applications', async(req, res)=>{
		const application = req.body;
		const result = await jobApplicationCollection.insertOne(application);

		//not the best way (use aggregate)
		const id = application.job_id;
		const query = { _id: new ObjectId(id)};
		const job = await jobsCollection.findOne(query);
		// console.log(job);

		let newCount = 0;
		if(job.applicationCount){
			newCount = job.applicationCount + 1;
		}
		else{
			newCount = 1;
		}

		//now update the job info
		const filter = { _id: new ObjectId(id)};
		const updatedDoc = {
			$set: {
				applicationCount: newCount
			}
		}
		const updateResult = await jobsCollection.updateOne(filter, updatedDoc)


		res.send(result);

	})


	//view applications page selected apis
	app.patch('/job-applications/:id', async(req, res)=>{
		const id = req.params.id;
		const data = req.body;
		const filter = {_id: new ObjectId(id)};
		const updateDoc = {
			$set: {
				status: data.status 
			}
		}
		const result = await jobApplicationCollection.updateOne(filter, updateDoc);
		res.send(result);
	})
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res)=>{
	res.send('job is falling from the sky');
})


app.listen(port, ()=>{
	console.log(`job is running for: ${port}`);
})