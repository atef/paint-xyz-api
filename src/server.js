import express from "express"
import { MongoClient } from "mongodb"
import 'dotenv/config'

// Wrap endpoints in an async function to use just one connection to the DB
async function startServer () {
    //DB Connection string
    const url = `mongodb+srv://${process.env.mongoDB_user}:${process.env.mongodb_password}@fullstackcodechallenge.3jhhzso.mongodb.net/?retryWrites=true&w=majority&appName=FullStackCodeChallenge`

    // Create DB Driver Client
    const client = new MongoClient(url)

    // Connect to DB
    await client.connect()
    const db = client.db('codechallande-db') 

    // Create express app and the port number
    const app = express();

    // Ensure express is able to send back with the .json function
    app.use(express.json())
    
    app.use(express.static(
        path.resolve(__dirname, '../dist'),
        { maxAge: '1y', etag: false }
    ))

    // GET End Points
    // get all active users
    app.get('/api/v1/active-users' , async (req, res) => {
        const users = await db.collection('users').find({ isActive: true}).toArray()
        res.json(users);
    })

    // get all Paints
    app.get('/api/v1/paints' , async (req, res) => {
        const paints = await db.collection('paints').find({}).toArray()
        res.json(paints)
    })

    // Get All Users
    app.get('/api/v1/users', async (req, res) => {
        const users = await db.collection('users').find({}).toArray()
        res.json(users)
    })

    // Get User Details
    app.get('/api/v1/users/:userId', async (req, res) => {
        const userId = Number(req.params.userId)
        const user = await db.collection('users').findOne({ id : userId})
        res.json(user)
    })


    // PUT Endpoints
    // Update paint quantities based on specified action
    app.put('/api/v1/paints', async (req, res) => {
        const paintId = req.body.id
        const action = req.body.action

        let incrementor = 0;
        if (action === 'Order') incrementor = 1;
        else if (action === 'Use') incrementor = -1;

        await db.collection('paints').updateOne({id : paintId}, {
                $inc: {inventory : incrementor}
            })

        const paints = await db.collection('paints').find({}).toArray()
        res.json(paints)
    })

    // Update user Role OR wheather or not isActive
    app.put('/api/v1/users', async (req, res) => {
        const userId = req.body.id // ID of the user to update
        
        //New User Data
        let newValues = {}

        if (req.body.name != null) newValues.name = req.body.name
        if (req.body.role != null) newValues.role = req.body.role
        if (req.body.isActive != null) newValues.isActive = req.body.isActive

        if (Object.keys(newValues).length !== 0)
            await db.collection('users').updateOne({id : userId}, {
                $set: newValues
            })

        const users = await db.collection('users').find({}).toArray()
        res.json(users)
    })

    app.get('*', (req, res) => {
        res.sendFile(path.join(__direname, '../dist/index.html'))
    })

    const PORT = process.env.PORT || 8000

    app.listen(PORT, () => {
        console.log(`server is listening on port ${PORT}`)
    })
}

startServer()
