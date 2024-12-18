const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


//middleware
app.use(cors());
app.use(express.json());



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



	//jobs related apis 
	const jobsCollection = client.db('jobPortal2').collection('jobs2');
	const jobApplicationCollection = client.db('jobPortal2').collection('job_application2')

	app.get('/jobs' , async(req, res)=>{
		const cursor = jobsCollection.find();
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


	//job application find specific email data
	app.get('/job-application', async(req, res) =>{
		const email = req.query.email;
		const query = {applicant_email: email};
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

	//job application collection apis
	app.post('/job-applications', async(req, res)=>{
		const application = req.body;
		const result = await jobApplicationCollection.insertOne(application);
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