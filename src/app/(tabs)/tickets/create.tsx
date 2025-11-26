import { View, ScrollView, Text, Alert, TouchableOpacity, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ProgressBar, Card, Avatar, IconButton, TextInput, HelperText, Chip } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCompanyStore } from '@/stores/companyStore';
import { useTicketStore } from '@/stores/ticketStore';
import { ControlledInput } from '@/components/ui/ControlledInput';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CompanyExploreItem } from '@/types/company';

const createTicketSchema = z.object({
    title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
    description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
    categoryId: z.string().min(1, 'Debes seleccionar una categoría'),
    priority: z.enum(['low', 'medium', 'high']),
});

type CreateTicketData = z.infer<typeof createTicketSchema>;

export default function CreateTicketScreen() {
    const router = useRouter();
    const { companies, fetchCompanies, companiesLoading, setFilter, clearFilters } = useCompanyStore();
    const { createTicket, isLoading, categories, fetchCategories } = useTicketStore();

    const [step, setStep] = useState(1);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<ImagePicker.ImagePickerAsset[]>([]);

    const { control, handleSubmit, formState: { errors, isValid } } = useForm<CreateTicketData>({
        resolver: zodResolver(createTicketSchema),
        defaultValues: {
            priority: 'medium',
        },
        mode: 'onChange',
    });

    useEffect(() => {
        // Fetch only followed companies
        setFilter('followedByMe', true);
        fetchCompanies();

        // Cleanup: reset filter when component unmounts
        return () => {
            clearFilters();
        };
    }, []);

    useEffect(() => {
        if (selectedCompanyId) {
            fetchCategories(selectedCompanyId);
        }
    }, [selectedCompanyId]);

    const handleNext = () => {
        if (step === 1 && selectedCompanyId) {
            setStep(2);
        } else if (step === 2 && isValid) {
            setStep(3);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            router.back();
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setAttachments([...attachments, ...result.assets]);
        }
    };

    const removeAttachment = (index: number) => {
        const newAttachments = [...attachments];
        newAttachments.splice(index, 1);
        setAttachments(newAttachments);
    };

    const onSubmit = async (data: CreateTicketData) => {
        if (!selectedCompanyId) return;

        try {
            await createTicket({
                title: data.title,
                description: data.description,
                category_id: data.categoryId,
                priority: data.priority,
                company_id: selectedCompanyId
            }, attachments);

            Alert.alert('Éxito', 'Ticket creado correctamente', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/tickets') }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo crear el ticket');
        }
    };

    const renderStep1 = () => (
        <View>
            <Text className="text-xl font-bold text-gray-900 mb-4">Selecciona una Empresa</Text>
            <ScrollView className="max-h-[70vh]">
                {companiesLoading ? (
                    <View className="items-center py-8">
                        <Text className="text-gray-500 text-center">Cargando empresas...</Text>
                    </View>
                ) : companies.length === 0 ? (
                    <View className="items-center py-8">
                        <Text className="text-gray-500 text-center">No sigues a ninguna empresa aún.</Text>
                        <Button mode="text" onPress={() => router.push('/(tabs)/companies')}>Explorar Empresas</Button>
                    </View>
                ) : (
                    companies.map((company: CompanyExploreItem) => (
                        <TouchableOpacity
                            key={company.id}
                            onPress={() => setSelectedCompanyId(company.id)}
                            className={`p-4 mb-3 rounded-xl border-2 flex-row items-center ${selectedCompanyId === company.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                        >
                            {company.logoUrl ? (
                                <Avatar.Image size={40} source={{ uri: company.logoUrl }} />
                            ) : (
                                <Avatar.Text size={40} label={company.name.substring(0, 2)} />
                            )}
                            <View className="ml-3">
                                <Text className={`font-bold ${selectedCompanyId === company.id ? 'text-blue-900' : 'text-gray-900'}`}>{company.name}</Text>
                                <Text className="text-gray-500 text-xs">{typeof company.industry === 'object' ? company.industry?.name : company.industry}</Text>
                            </View>
                            {selectedCompanyId === company.id && (
                                <View className="ml-auto">
                                    <MaterialCommunityIcons name="check-circle" size={24} color="#2563eb" />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );

    const renderStep2 = () => {
        const selectedCompany = companies.find((c: CompanyExploreItem) => c.id === selectedCompanyId);
        return (
            <View>
                <View className="flex-row items-center mb-6 bg-gray-100 p-3 rounded-lg">
                    <Text className="text-gray-600 text-sm">Creando ticket para: </Text>
                    <Text className="font-bold text-gray-900 ml-1">{selectedCompany?.name}</Text>
                </View>

                <ControlledInput
                    control={control}
                    name="title"
                    label="Asunto"
                    placeholder="Resumen breve del problema"
                />

                <ControlledInput
                    control={control}
                    name="description"
                    label="Descripción Detallada"
                    placeholder="Explica el problema con detalle..."
                    multiline
                    numberOfLines={5}
                />

                <Text className="text-gray-700 font-bold mb-2 mt-2">Categoría</Text>
                <Controller
                    control={control}
                    name="categoryId"
                    render={({ field: { onChange, value } }) => (
                        <View className="flex-row flex-wrap gap-2 mb-4">
                            {categories.map((cat: any) => (
                                <Chip
                                    key={cat.id}
                                    selected={value === cat.id}
                                    onPress={() => onChange(cat.id)}
                                    showSelectedOverlay
                                    mode="outlined"
                                >
                                    {cat.name}
                                </Chip>
                            ))}
                        </View>
                    )}
                />
                {errors.categoryId && <HelperText type="error">{errors.categoryId.message}</HelperText>}

                <Text className="text-gray-700 font-bold mb-2">Prioridad</Text>
                <Controller
                    control={control}
                    name="priority"
                    render={({ field: { onChange, value } }) => (
                        <View className="flex-row gap-2 mb-4">
                            {['low', 'medium', 'high'].map((p) => (
                                <Chip
                                    key={p}
                                    selected={value === p}
                                    onPress={() => onChange(p)}
                                    showSelectedOverlay
                                    mode="outlined"
                                    className={value === p ? (p === 'high' ? 'bg-red-50' : p === 'medium' ? 'bg-yellow-50' : 'bg-green-50') : ''}
                                >
                                    {p === 'low' ? 'Baja' : p === 'medium' ? 'Media' : 'Alta'}
                                </Chip>
                            ))}
                        </View>
                    )}
                />
            </View>
        );
    };

    const renderStep3 = () => (
        <View>
            <Text className="text-xl font-bold text-gray-900 mb-2">Adjuntar Archivos (Opcional)</Text>
            <Text className="text-gray-500 mb-6">Puedes subir capturas de pantalla o documentos que ayuden a entender el problema.</Text>

            <View className="flex-row flex-wrap gap-3 mb-6">
                {attachments.map((file, index) => (
                    <View key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                        <Image source={{ uri: file.uri }} className="w-full h-full" resizeMode="cover" />
                        <TouchableOpacity
                            onPress={() => removeAttachment(index)}
                            className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                        >
                            <MaterialCommunityIcons name="close" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                ))}

                <TouchableOpacity
                    onPress={pickImage}
                    className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 items-center justify-center bg-gray-50"
                >
                    <MaterialCommunityIcons name="camera-plus" size={32} color="#9ca3af" />
                    <Text className="text-xs text-gray-400 mt-1">Añadir</Text>
                </TouchableOpacity>
            </View>

            <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                disabled={isLoading}
                className="mt-4"
            >
                Crear Ticket
            </Button>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="p-4 border-b border-gray-200 flex-row items-center">
                <TouchableOpacity onPress={handleBack} className="mr-4">
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">Nuevo Ticket</Text>
            </View>

            <View className="px-6 py-4">
                <View className="flex-row justify-between mb-2">
                    <Text className={`text-xs font-bold ${step >= 1 ? 'text-blue-600' : 'text-gray-300'}`}>Empresa</Text>
                    <Text className={`text-xs font-bold ${step >= 2 ? 'text-blue-600' : 'text-gray-300'}`}>Detalles</Text>
                    <Text className={`text-xs font-bold ${step >= 3 ? 'text-blue-600' : 'text-gray-300'}`}>Adjuntos</Text>
                </View>
                <ProgressBar progress={step / 3} color="#2563eb" className="h-2 rounded-full bg-gray-100" />
            </View>

            <ScrollView className="flex-1 p-6">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </ScrollView>

            {step < 3 && (
                <View className="p-4 border-t border-gray-200">
                    <Button
                        mode="contained"
                        onPress={handleNext}
                        disabled={step === 1 && !selectedCompanyId}
                    >
                        Siguiente
                    </Button>
                </View>
            )}
        </SafeAreaView>
    );
}
