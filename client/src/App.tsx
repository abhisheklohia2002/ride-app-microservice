import './App.css'
import { motion } from "motion/react";

function App() {

 return(
  <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      Ride App
    </motion.div>
  </>
 )
}

export default App
