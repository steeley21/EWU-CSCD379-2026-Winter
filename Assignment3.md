# EWU-CSCD378-2026-Winter

## Assignment 3

The purpose of this assignment is to solidify your learning of:
- Creating an API and deploying it to an Azure App Service with an Azure SQL database
- Calling the API from the client
- Using Entity Framework to store data in SQL Server
- Configuring SQL Server for localhost development and Azure
- Entity Framework Migrations

## General Guidance
Develop a game that doesn't already exist using your abilities augmented with AI
- When we developed Wordle, the AI already knew the rules of the game Wordle. This made it easier.
- This game should be a new idea and not something that an AI could have trained on or could search for.
- The game can be based on something existing, but needs to have a significant number of unique elements.
- It should be small enough in scope but hit all the requirements.

## Turn in Process
- On your fork, create an Assignment3 branch 
- Update this branch (Fetch upstream) from the Assignment3 branch in the class repo. [Assignment3 in class repo](https://github.com/IntelliTect-Samples/EWU-CSCD379-2022-Spring/tree/Assignment3)
- Do your homework in your Assignment3 branch
- Submit your pull request against Assignment3 in the class repo
- Ask in Teams chat if you have questions or issues

## Requirements

**1. Create a client-side Nuxt game ** ❌✅
- Is unique and not searchable on the internet  ❌✅
- Has at least 3 pages that require navigation go get between ❌✅
- Clear start, middle, and end (win/loss) ❌✅
- Some sort of strategy or skill is involved and is not just random ❌✅
- Works on desktop and mobile ❌✅
- Has some need for a server side service ❌✅
- Needs a custom favicon ❌✅
- It should look good and feel like polished software ❌✅

**2. Create a server-side API for the game** ❌✅
- Set up CORS (Cross Origin Resource Sharing) ❌✅
- At least one GET endpoint that returns an object ❌✅
- At least one POST endpoint that accepts an object and returns as object ❌✅
- Data from the POST should be stored to the database using Entity Framework ❌✅
- Data for the GET should be pulled from the database ❌✅
- All API should be async ❌✅

**3. Deployment** ❌✅
- The static web app needs to be deployed as a Azure Static App ❌✅
- The API should be deployed to an Azure App Service ❌✅
- The logic for the API should be implemented as a service ❌✅
- The database should be deployed to an Azure SQL database ❌✅
  - You can either use Azure auth or SQL auth ❌✅
  - Make sure to set network permissions correctly ❌✅
- Unit Tests should run on build ❌✅

**4. Unit testing** ❌✅ 
- Tests for the service ❌✅
- Integration tests for the controller ❌✅
- Basic clientside unit tests ❌✅

## Extra Credit
- Add cool animations ❌✅ 
- Create a hip logo (3) ❌✅
- Have several people play the game and provide a place where people can put testimonials ❌✅
