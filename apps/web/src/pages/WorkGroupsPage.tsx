import {
  PopoverForm,
  PopoverFormBody,
  PopoverFormButton,
  PopoverFormField,
  PopoverFormSuccess,
  popoverFormControlClass,
} from "@/components/PopoverForm"
import { createWorkGroup, getWorkGroups } from "@/lib/api"
import type { AuthUser, WorkGroup } from "@/lib/api"
import { err } from "@/lib/ui-ar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import type { FormEvent } from "react"
import { useEffect, useState } from "react"

export function WorkGroupsPage({ token, user }: { token: string; user: AuthUser }) {
  const [groups, setGroups] = useState<WorkGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [addState, setAddState] = useState<"idle" | "loading" | "success">("idle")

  const loadGroups = () => {
    getWorkGroups(token)
      .then(setGroups)
      .catch(() => setError(err.load))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadGroups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const onCreate = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setSuccess("")
    try {
      setAddState("loading")
      await createWorkGroup(token, { name })
      setName("")
      setLoading(true)
      loadGroups()
      setSuccess("تم إنشاء مجموعة العمل بنجاح.")
      setAddState("success")
      setTimeout(() => {
        setAddOpen(false)
        setAddState("idle")
      }, 900)
    } catch {
      setAddState("idle")
      setError(err.create)
    }
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">مجموعات العمل</h2>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {success ? <p className="text-sm text-green-600">{success}</p> : null}
      {user.role === "admin" ? (
        <PopoverForm
          title="إضافة مجموعة عمل"
          open={addOpen}
          setOpen={setAddOpen}
          width="420px"
          height="200px"
          showCloseButton={addState !== "success"}
          showSuccess={addState === "success"}
          openChild={
            <form className="flex h-full min-h-0 flex-col" onSubmit={onCreate}>
              <PopoverFormBody
                footer={
                  <div className="flex justify-end">
                    <PopoverFormButton loading={addState === "loading"} text="إنشاء المجموعة" variant="primary" />
                  </div>
                }
              >
                <PopoverFormField label="اسم المجموعة" htmlFor="add-work-group-name">
                  <input
                    id="add-work-group-name"
                    className={popoverFormControlClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </PopoverFormField>
              </PopoverFormBody>
            </form>
          }
          successChild={
            <PopoverFormSuccess title="تم إنشاء المجموعة" description="المجموعة جاهزة للاستخدام." />
          }
        />
      ) : null}
      {loading ? <p className="text-sm text-muted-foreground">جاري تحميل المجموعات…</p> : null}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>الاسم</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="h-24 text-center text-muted-foreground">
                  لا توجد مجموعات عمل بعد.
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
