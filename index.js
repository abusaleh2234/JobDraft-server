const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000


app.use(cors({
  origin: [
    "http://localhost:5173"
  ],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())


const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token
  // console.log(token);
  if(!token){
    return res.status(401).send({message: "unauthrized access"})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error,decoded) => {
    if(error){
      return res.status(401).send({message: "unauthrized access"})
    }
    req.user= decoded
    next()
  })
}




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kothmtv.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();


    const jobsCollection = client.db("jobDraftDB").collection("jobs");
    const applyedJobsCollection = client.db("jobDraftDB").collection("applyedJobs");


    // auth api
    app.post("/jwt", async(req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET , {expiresIn: "2h"})
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: "none"
      })
      .send({success: true})
    })

    app.post("/logout", async (req, res) => {
      const user = req.body;
      // console.log("logout user" , user);
      res.clearCookie('token',{maxAge: 0}).send({success: true})
    })




    // jobs api

    app.get("/jobs", async (req, res) => {
      const result = await jobsCollection.find().toArray()
      res.send(result)
    })

    app.get("/jobs/:ctgname", async (req, res) => {
      const category = req.params.ctgname
      // console.log(category);
      const filter = { category: category }
      const result = await jobsCollection.find(filter).toArray()
      res.send(result)
    })

    app.get("/jobssearch/:title", async (req, res) => {
      const title = req.params.title
      // console.log(title);
      const filter = { job_title: title }
      const result = await jobsCollection.find(filter).toArray()
      res.send(result)
    })

    app.get("/usersjobs", verifyToken, async (req, res) => {
      const email = req.query.email
      // console.log(email);
      console.log(req.cookies);
      const filter = { creator_email: email }
      const result = await jobsCollection.find(filter).toArray()
      res.send(result)
    })

    app.get("/jobsdetails/:id", async (req, res) => {
      const id = req.params.id
      // console.log(id);
      const filter = { _id: new ObjectId(id) }
      // console.log(filter);
      const result = await jobsCollection.findOne(filter)
      res.send(result)
    })

    app.get("/appliedjobs",async(req,res) => {
      const useremail = req.query.email
      // console.log(useremail);
      const filter = {email : useremail}
      const result = await applyedJobsCollection.find(filter).toArray()
      res.send(result)
    })

    app.get("/appliedjobsctg",async(req,res) => {
      const useremail = req.query.email
      const categoryname = req.query.ctg
      // console.log(useremail,categoryname);
      const filter = {email : useremail, category: categoryname}
      const result = await applyedJobsCollection.find(filter).toArray()
      res.send(result)
    })

    app.post("/jobspost", async (req, res) => {
      const newJob = req.body
      // console.log(newJob);
      const result = await jobsCollection.insertOne(newJob)
      res.send(result)
    })
    app.post("/applyedjobs", async (req, res) => {
      const applyJob = req.body
      // console.log(newJob);
      const result = await applyedJobsCollection.insertOne(applyJob)
      res.send(result)
    })

    app.put("/updatejob/:id", async (req, res) => {
      const id = req.params.id
      console.log(id);
      const job = req.body
      // console.log(job);
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updateJob = {
        $set: {
          post_creator_name: job.post_creator_name,
          job_title: job.job_title,
          category: job.category,
          job_posting_date: job.job_posting_date,
          application_deadline: job.application_deadline,
          salary_range: job.salary_range,
          job_applicants_number: job.job_applicants_number,
          job_banner_img: job.job_banner_img,
          job_description: job.job_description,
          creator_email: job.creator_email,
        },
      };
      const result = await jobsCollection.updateOne(filter, updateJob, options)
      res.send(result)
    })

    app.delete("/myjobdelete/:id", async (req, res) => {
      const id = req.params.id
      console.log(id);
      const query = {_id: new ObjectId(id)}
      const result = await jobsCollection.deleteOne(query)
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('jobdraft has boon runung soon')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})