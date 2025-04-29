"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SkillsLogger } from "@/utils/skills-logger"

export function RoleFocusSelect({ onSubmit }) {
  const [selectedFocus, setSelectedFocus] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedFocus) {
      // Log the selected role focus
      SkillsLogger.logRoleFocus(selectedFocus)

      onSubmit(selectedFocus)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <RadioGroup value={selectedFocus} onValueChange={setSelectedFocus}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-gray-50">
            <RadioGroupItem value="frontend" id="frontend" />
            <Label htmlFor="frontend" className="flex-1 cursor-pointer">
              <div className="font-medium">Frontend Development</div>
              <div className="text-sm text-gray-500">UI/UX, React, Vue, Angular</div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-gray-50">
            <RadioGroupItem value="backend" id="backend" />
            <Label htmlFor="backend" className="flex-1 cursor-pointer">
              <div className="font-medium">Backend Development</div>
              <div className="text-sm text-gray-500">APIs, Databases, Server-side</div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-gray-50">
            <RadioGroupItem value="fullstack" id="fullstack" />
            <Label htmlFor="fullstack" className="flex-1 cursor-pointer">
              <div className="font-medium">Full-Stack Development</div>
              <div className="text-sm text-gray-500">End-to-end application development</div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-gray-50">
            <RadioGroupItem value="data" id="data" />
            <Label htmlFor="data" className="flex-1 cursor-pointer">
              <div className="font-medium">Data Science/Engineering</div>
              <div className="text-sm text-gray-500">ML, Analytics, Data Processing</div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-gray-50">
            <RadioGroupItem value="devops" id="devops" />
            <Label htmlFor="devops" className="flex-1 cursor-pointer">
              <div className="font-medium">DevOps/Cloud</div>
              <div className="text-sm text-gray-500">CI/CD, Infrastructure, Deployment</div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-gray-50">
            <RadioGroupItem value="mobile" id="mobile" />
            <Label htmlFor="mobile" className="flex-1 cursor-pointer">
              <div className="font-medium">Mobile Development</div>
              <div className="text-sm text-gray-500">iOS, Android, React Native</div>
            </Label>
          </div>
        </div>
      </RadioGroup>
      <div className="flex justify-center">
        <Button type="submit" disabled={!selectedFocus}>
          Continue
        </Button>
      </div>
    </form>
  )
}
