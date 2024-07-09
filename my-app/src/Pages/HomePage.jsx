import '../App.css'
import LandingPage from '../components/LandingPage';
import Navigation from '../components/Navigation'
const App=() =>{

    return <div> 
     {/* <ClerkProvider publishableKey={clerkPubKey}> */}
     
    <Navigation/>
    <LandingPage/>
   
</div>
  
}
export default App;