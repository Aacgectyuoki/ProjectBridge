"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@supabase/supabase-js"
import type { Skill, SkillCategory } from "@/types/skill-taxonomy"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export default function SkillTaxonomyManager() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [categories, setCategories] = useState<SkillCategory[]>([])
  const [activeTab, setActiveTab] = useState("skills")
  const [newSkill, setNewSkill] = useState({ name: "", category: "" })
  const [newEquivalent, setNewEquivalent] = useState({ skillId: "", term: "" })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)

      // Load skills
      const { data: skillsData, error: skillsError } = await supabase.from("skills").select("*").order("name")

      if (!skillsError) {
        setSkills(skillsData as Skill[])
      }

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("skill_categories")
        .select("*")
        .order("name")

      if (!categoriesError) {
        setCategories(categoriesData as SkillCategory[])
      }

      setLoading(false)
    }

    loadData()
  }, [])

  async function handleAddSkill(e: React.FormEvent) {
    e.preventDefault()

    if (!newSkill.name || !newSkill.category) return

    const normalizedName = newSkill.name.toLowerCase().trim()

    const { error } = await supabase.from("skills").insert({
      name: newSkill.name,
      normalized_name: normalizedName,
      category: newSkill.category,
    })

    if (!error) {
      // Reload skills
      const { data } = await supabase.from("skills").select("*").order("name")

      setSkills(data as Skill[])
      setNewSkill({ name: "", category: "" })
    }
  }

  async function handleAddEquivalent(e: React.FormEvent) {
    e.preventDefault()

    if (!newEquivalent.skillId || !newEquivalent.term) return

    const normalizedTerm = newEquivalent.term.toLowerCase().trim()

    const { error } = await supabase.from("skill_equivalents").insert({
      skill_id: newEquivalent.skillId,
      equivalent_term: newEquivalent.term,
      normalized_term: normalizedTerm,
    })

    if (!error) {
      setNewEquivalent({ skillId: "", term: "" })
    }
  }

  if (loading) {
    return <div>Loading skill taxonomy...</div>
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Skill Taxonomy Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="equivalents">Equivalents</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
          </TabsList>

          <TabsContent value="skills" className="space-y-4">
            <form onSubmit={handleAddSkill} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="skill-name">Skill Name</Label>
                  <Input
                    id="skill-name"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    placeholder="e.g. Python"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skill-category">Category</Label>
                  <select
                    id="skill-category"
                    value={newSkill.category}
                    onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit">Add Skill</Button>
            </form>

            <div className="border rounded p-4">
              <h3 className="font-medium mb-2">Existing Skills</h3>
              <div className="grid grid-cols-3 gap-2">
                {skills.map((skill) => (
                  <div key={skill.id} className="p-2 border rounded">
                    <div className="font-medium">{skill.name}</div>
                    <div className="text-sm text-gray-500">{skill.category}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="equivalents" className="space-y-4">
            <form onSubmit={handleAddEquivalent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="skill-id">Skill</Label>
                  <select
                    id="skill-id"
                    value={newEquivalent.skillId}
                    onChange={(e) => setNewEquivalent({ ...newEquivalent, skillId: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select a skill</option>
                    {skills.map((skill) => (
                      <option key={skill.id} value={skill.id}>
                        {skill.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equivalent-term">Equivalent Term</Label>
                  <Input
                    id="equivalent-term"
                    value={newEquivalent.term}
                    onChange={(e) => setNewEquivalent({ ...newEquivalent, term: e.target.value })}
                    placeholder="e.g. Python 3"
                  />
                </div>
              </div>
              <Button type="submit">Add Equivalent</Button>
            </form>

            {/* We'd add a list of existing equivalents here */}
          </TabsContent>

          <TabsContent value="relationships" className="space-y-4">
            {/* Relationship management UI would go here */}
            <p>Relationship management coming soon...</p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
